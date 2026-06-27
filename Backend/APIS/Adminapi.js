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

// Get all products (for admin management)
adminApp.get("/products", verifyToken("ADMIN"), async (req, res) => {
  try {
    const products = await ProductModel.find()
      .populate("artisan", "firstName lastName businessName")
      .sort({ createdAt: -1 });
    res.status(200).json({ message: "All products fetched", payload: products });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete a product with a reason
adminApp.delete("/products/:id", verifyToken("ADMIN"), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: "Reason for deletion is required" });
    }

    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Send a message/notification to the artisan
    const artisanId = product.artisan;
    await UserModel.findByIdAndUpdate(artisanId, {
      $push: {
        notifications: {
          message: `Your product "${product.title}" was deleted by the Admin. Reason: ${reason}`,
          createdAt: new Date(),
        },
      },
    });

    // Delete the product
    await ProductModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted and artisan notified" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

// Get all users in the system with their products
adminApp.get("/users", verifyToken("ADMIN"), async (req, res) => {
  try {
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
    
    // For each user, attach their products if they are an artisan
    const usersWithProducts = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        if (user.role === "ARTISAN") {
          const products = await ProductModel.find({ artisan: user._id }).select("title price isApproved isActive");
          userObj.products = products;
        } else {
          userObj.products = [];
        }
        return userObj;
      })
    );

    res.status(200).json({ message: "Users fetched", payload: usersWithProducts });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

// Toggle user active status (deactivate or activate back)
adminApp.put("/users/:id/toggle", verifyToken("ADMIN"), async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Admin status cannot be toggled" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ message: `User status set to ${user.isActive ? "Active" : "Inactive"}`, payload: user });
  } catch (err) {
    res.status(500).json({ message: "Error toggling user status", error: err.message });
  }
});

// Delete a user (buyer or artisan) and their products
adminApp.delete("/users/:id", verifyToken("ADMIN"), async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Admin accounts cannot be deleted" });
    }

    // Delete artisan's products if they are an artisan
    if (user.role === "ARTISAN") {
      await ProductModel.deleteMany({ artisan: user._id });
    }

    // Delete the user
    await UserModel.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "User and their products deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});