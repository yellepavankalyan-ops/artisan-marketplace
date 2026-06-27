import exp from "express";
import { ProductModel } from "../models/ProductModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../config/multer.js";
export const productApp = exp.Router();

// Get all products (with filters)
productApp.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort, page = 1, limit = 12 } = req.query;

    let filter = { isActive: true, isApproved: true };

    if (category && category !== "All") filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let sortOption = {};
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "popular") sortOption = { soldCount: -1 };
    else sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .populate("artisan", "firstName lastName businessName location profileImageUrl rating")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      message: "Products fetched",
      payload: products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

// Get featured products
productApp.get("/featured", async (req, res) => {
  try {
    const products = await ProductModel.find({ isActive: true, isApproved: true, isFeatured: true })
      .populate("artisan", "firstName lastName businessName location profileImageUrl")
      .limit(8);
    res.status(200).json({ message: "Featured products", payload: products });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Get single product by ID
productApp.get("/:id", async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
      .populate("artisan", "firstName lastName businessName location profileImageUrl bio story storyImageUrl rating reviewCount")
      .populate("reviews.buyer", "firstName lastName profileImageUrl");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product found", payload: product });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Add review (buyers only)
productApp.post("/:id/review", verifyToken("BUYER"), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if buyer already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.buyer.toString() === req.user.id
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    product.reviews.push({ buyer: req.user.id, rating, comment });
    product.totalReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
});