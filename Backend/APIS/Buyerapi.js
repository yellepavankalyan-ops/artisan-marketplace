import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../config/multer.js";

export const buyerApp = exp.Router();

// Get buyer profile
buyerApp.get("/profile", verifyToken("BUYER"), async (req, res) => {
  try {
    const buyer = await UserModel.findById(req.user.id)
      .select("-password")
      .populate("wishlist");
    res.status(200).json({ message: "Profile fetched", payload: buyer });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update buyer profile
buyerApp.put(
  "/profile",
  verifyToken("BUYER"),
  upload.single("profileImageUrl"),
  async (req, res) => {
    try {
      const updates = req.body;
      if (req.file) {
        if (!req.file.path.startsWith("http://") && !req.file.path.startsWith("https://")) {
          const normalizedPath = req.file.path.replace(/\\/g, "/");
          updates.profileImageUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;
        } else {
          updates.profileImageUrl = req.file.path;
        }
      }

      // Handle address as nested object
      if (updates["address.street"] !== undefined) {
        updates.address = {
          street: updates["address.street"] || "",
          city: updates["address.city"] || "",
          state: updates["address.state"] || "",
          pincode: updates["address.pincode"] || "",
        };
        delete updates["address.street"];
        delete updates["address.city"];
        delete updates["address.state"];
        delete updates["address.pincode"];
      }

      const updatedBuyer = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: false }
      ).select("-password");

      res.status(200).json({ message: "Profile updated", payload: updatedBuyer });
    } catch (err) {
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  }
);

// Add to wishlist
buyerApp.post("/wishlist/:productId", verifyToken("BUYER"), async (req, res) => {
  try {
    const buyer = await UserModel.findById(req.user.id);
    const productId = req.params.productId;

    if (buyer.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Already in wishlist" });
    }

    buyer.wishlist.push(productId);
    await buyer.save();
    res.status(200).json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Remove from wishlist
buyerApp.delete("/wishlist/:productId", verifyToken("BUYER"), async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user.id, {
      $pull: { wishlist: req.params.productId },
    });
    res.status(200).json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get wishlist
buyerApp.get("/wishlist", verifyToken("BUYER"), async (req, res) => {
  try {
    const buyer = await UserModel.findById(req.user.id).populate({
      path: "wishlist",
      populate: { path: "artisan", select: "firstName lastName businessName" },
    });
    res.status(200).json({ message: "Wishlist fetched", payload: buyer.wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get all artisans (public listing for buyers to browse)
buyerApp.get("/artisans", async (req, res) => {
  try {
    const activeArtisanIds = await ProductModel.distinct("artisan", { isActive: true, isApproved: true });
    const artisans = await UserModel.find({
      _id: { $in: activeArtisanIds },
      role: "ARTISAN",
      isActive: true,
    })
      .select("-password -kycDocumentUrl -email")
      .sort({ totalSales: -1 });

    const artisansWithImages = await Promise.all(
      artisans.map(async (artisan) => {
        const artisanObj = artisan.toObject();
        const firstProduct = await ProductModel.findOne({
          artisan: artisan._id,
          isActive: true,
          isApproved: true,
        }).select("images");
        artisanObj.fallbackProductImage = firstProduct?.images?.[0] || null;
        return artisanObj;
      })
    );

    res.status(200).json({ message: "Artisans fetched", payload: artisansWithImages });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});