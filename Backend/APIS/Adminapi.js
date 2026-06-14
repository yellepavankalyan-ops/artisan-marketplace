import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const adminApp = exp.Router();

// Dashboard stats
adminApp.get("/stats", verifyToken("ADMIN"), async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalArtisans = await UserModel.countDocuments({ role: "ARTISAN" });
    const totalBuyers = await UserModel.countDocuments({ role: "BUYER" });
    const pendingKYC = await UserModel.countDocuments({ role: "ARTISAN", kycStatus: "SUBMITTED" });
    const totalProducts = await ProductModel.countDocuments();
    const pendingApproval = await ProductModel.countDocuments({ isApproved: false, isActive: true });
    const totalOrders = await OrderModel.countDocuments();
    const revenue = await OrderModel.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.status(200).json({
      message: "Stats fetched",
      payload: {
        totalUsers,
        totalArtisans,
        totalBuyers,
        pendingKYC,
        totalProducts,
        pendingApproval,
        totalOrders,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get all artisans with KYC status
adminApp.get("/artisans", verifyToken("ADMIN"), async (req, res) => {
  try {
    const artisans = await UserModel.find({ role: "ARTISAN" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Artisans fetched", payload: artisans });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Approve / Reject KYC
adminApp.put("/artisan/:id/kyc", verifyToken("ADMIN"), async (req, res) => {
  try {
    const { status } = req.body; // "APPROVED" or "REJECTED"
    const kycVerified = status === "APPROVED";
    const artisan = await UserModel.findByIdAndUpdate(
      req.params.id,
      { kycStatus: status, kycVerified },
      { new: true }
    ).select("-password");
    res.status(200).json({ message: `KYC ${status}`, payload: artisan });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Toggle artisan active/inactive
adminApp.put("/artisan/:id/toggle", verifyToken("ADMIN"), async (req, res) => {
  try {
    const artisan = await UserModel.findById(req.params.id);
    artisan.isActive = !artisan.isActive;
    await artisan.save();
    res.status(200).json({ message: "Updated", payload: artisan });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get pending products
adminApp.get("/products/pending", verifyToken("ADMIN"), async (req, res) => {
  try {
    const products = await ProductModel.find({ isApproved: false, isActive: true })
      .populate("artisan", "firstName lastName businessName")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "Pending products", payload: products });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Approve product
adminApp.put("/products/:id/approve", verifyToken("ADMIN"), async (req, res) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    res.status(200).json({ message: "Product approved", payload: product });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Reject / deactivate product
adminApp.put("/products/:id/reject", verifyToken("ADMIN"), async (req, res) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.status(200).json({ message: "Product rejected", payload: product });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Toggle featured
adminApp.put("/products/:id/feature", verifyToken("ADMIN"), async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    product.isFeatured = !product.isFeatured;
    await product.save();
    res.status(200).json({ message: "Featured status toggled", payload: product });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// All orders
adminApp.get("/orders", verifyToken("ADMIN"), async (req, res) => {
  try {
    const orders = await OrderModel.find()
      .populate("buyer", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ message: "Orders fetched", payload: orders });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});