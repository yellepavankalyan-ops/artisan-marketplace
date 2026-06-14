import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../config/multer.js";
export const artisanApp = exp.Router();

// Get artisan profile
artisanApp.get("/profile", verifyToken("ARTISAN"), async (req, res) => {
  try {
    const artisan = await UserModel.findById(req.user.id).select("-password");
    res.status(200).json({ message: "Profile fetched", payload: artisan });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update artisan profile
artisanApp.put(
  "/profile",
  verifyToken("ARTISAN"),
  upload.fields([
    { name: "profileImageUrl", maxCount: 1 },
    { name: "storyImageUrl", maxCount: 1 },
    { name: "kycDocumentUrl", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updates = req.body;
      if (req.files?.profileImageUrl) updates.profileImageUrl = req.files.profileImageUrl[0].path;
      if (req.files?.storyImageUrl) updates.storyImageUrl = req.files.storyImageUrl[0].path;
      if (req.files?.kycDocumentUrl) {
        updates.kycDocumentUrl = req.files.kycDocumentUrl[0].path;
        updates.kycVerified = false; // Reset verification on new document
        updates.kycStatus = "SUBMITTED";
      }

      const updatedArtisan = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: false }
      ).select("-password");

      res.status(200).json({ message: "Profile updated successfully", payload: updatedArtisan });
    } catch (err) {
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  }
);

// Add a new product
artisanApp.post(
  "/products",
  verifyToken("ARTISAN"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const artisan = await UserModel.findById(req.user.id);
      if (!artisan.kycVerified) {
        return res.status(403).json({ message: "KYC verification required to list products" });
      }

      const productData = req.body;
      productData.artisan = req.user.id;

      if (req.files && req.files.length > 0) {
        productData.images = req.files.map((f) => f.path);
      }

      if (typeof productData.tags === "string") {
        productData.tags = productData.tags.split(",").map((t) => t.trim());
      }

      const newProduct = new ProductModel(productData);
      await newProduct.save();

      res.status(201).json({ message: "Product listed! Awaiting admin approval.", payload: newProduct });
    } catch (err) {
      res.status(500).json({ message: "Error adding product", error: err.message });
    }
  }
);

// Get artisan's own products
artisanApp.get("/products", verifyToken("ARTISAN"), async (req, res) => {
  try {
    const products = await ProductModel.find({ artisan: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ message: "Products fetched", payload: products });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update a product
artisanApp.put(
  "/products/:id",
  verifyToken("ARTISAN"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const product = await ProductModel.findOne({ _id: req.params.id, artisan: req.user.id });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const updates = req.body;
      if (req.files && req.files.length > 0) {
        updates.images = req.files.map((f) => f.path);
      }
      if (typeof updates.tags === "string") {
        updates.tags = updates.tags.split(",").map((t) => t.trim());
      }

      updates.isApproved = false; // Re-approval needed on edit

      const updatedProduct = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
      );

      res.status(200).json({ message: "Product updated. Awaiting re-approval.", payload: updatedProduct });
    } catch (err) {
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  }
);

// Delete a product
artisanApp.delete("/products/:id", verifyToken("ARTISAN"), async (req, res) => {
  try {
    const product = await ProductModel.findOne({ _id: req.params.id, artisan: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    await ProductModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// Get public artisan profile + their products (for storefront)
artisanApp.get("/storefront/:id", async (req, res) => {
  try {
    const artisan = await UserModel.findById(req.params.id).select(
      "-password -kycDocumentUrl -email"
    );
    if (!artisan || artisan.role !== "ARTISAN") {
      return res.status(404).json({ message: "Artisan not found" });
    }

    const products = await ProductModel.find({
      artisan: req.params.id,
      isActive: true,
      isApproved: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({ message: "Storefront loaded", artisan, products });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});
