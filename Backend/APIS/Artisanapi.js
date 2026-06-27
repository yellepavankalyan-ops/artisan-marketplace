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
      const getFileUrl = (file) => {
        if (!file) return null;
        if (!file.path.startsWith("http://") && !file.path.startsWith("https://")) {
          const normalizedPath = file.path.replace(/\\/g, "/");
          return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
        }
        return file.path;
      };

      if (req.files?.profileImageUrl) updates.profileImageUrl = getFileUrl(req.files.profileImageUrl[0]);
      if (req.files?.storyImageUrl) updates.storyImageUrl = getFileUrl(req.files.storyImageUrl[0]);
      if (req.files?.kycDocumentUrl) {
        updates.kycDocumentUrl = getFileUrl(req.files.kycDocumentUrl[0]);
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
      // KYC verification check is bypassed since KYC is no longer required
      // const artisan = await UserModel.findById(req.user.id);
      // if (!artisan.kycVerified) {
      //   return res.status(403).json({ message: "KYC verification required to list products" });
      // }

      const productData = req.body;
      productData.artisan = req.user.id;

      if (req.files && req.files.length > 0) {
        productData.images = req.files.map((f) => {
          if (!f.path.startsWith("http://") && !f.path.startsWith("https://")) {
            const normalizedPath = f.path.replace(/\\/g, "/");
            return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
          }
          return f.path;
        });
      }

      const categoryPlaceholders = {
        "Pottery": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        "Textiles": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "Jewelry": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
        "Woodwork": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
        "Painting": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
        "Metalwork": "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80",
        "Leather": "https://images.unsplash.com/photo-1524498250077-390f9e378db0?auto=format&fit=crop&w=800&q=80",
        "Bamboo & Cane": "https://images.unsplash.com/photo-1501747315-124a0eaca060?auto=format&fit=crop&w=800&q=80",
        "Embroidery": "https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?auto=format&fit=crop&w=800&q=80",
        "Other": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
      };

      if (!productData.images || productData.images.length === 0) {
        productData.images = [categoryPlaceholders[productData.category] || categoryPlaceholders["Other"]];
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
        updates.images = req.files.map((f) => {
          if (!f.path.startsWith("http://") && !f.path.startsWith("https://")) {
            const normalizedPath = f.path.replace(/\\/g, "/");
            return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
          }
          return f.path;
        });
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
