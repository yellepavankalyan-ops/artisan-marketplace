import exp from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { config } from "dotenv";
config();

export const orderApp = exp.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order (initiate payment)
orderApp.post("/create-razorpay-order", verifyToken("BUYER"), async (req, res) => {
  try {
    const { totalAmount } = req.body;

    const options = {
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({
      message: "Razorpay order created",
      payload: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Payment initiation failed", error: err.message });
  }
});

// Verify payment & save order
orderApp.post("/verify-payment", verifyToken("BUYER"), async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      totalAmount,
      shippingAddress,
    } = req.body;

    // Verify signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Payment verification failed - invalid signature" });
    }

    // Create order in DB
    const newOrder = new OrderModel({
      buyer: req.user.id,
      items,
      totalAmount,
      shippingAddress,
      paymentStatus: "PAID",
      orderStatus: "PLACED",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    await newOrder.save();

    // Update stock & soldCount
    for (const item of items) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }

    res.status(201).json({ message: "Order placed successfully!", payload: newOrder });
  } catch (err) {
    res.status(500).json({ message: "Order creation failed", error: err.message });
  }
});

// Get buyer's orders
orderApp.get("/my-orders", verifyToken("BUYER"), async (req, res) => {
  try {
    const orders = await OrderModel.find({ buyer: req.user.id })
      .populate("items.product", "title images")
      .populate("items.artisan", "firstName lastName businessName")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Orders fetched", payload: orders });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get single order
orderApp.get("/:id", verifyToken("BUYER", "ARTISAN", "ADMIN"), async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
      .populate("buyer", "firstName lastName email phone")
      .populate("items.product", "title images category")
      .populate("items.artisan", "firstName lastName businessName");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order found", payload: order });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});