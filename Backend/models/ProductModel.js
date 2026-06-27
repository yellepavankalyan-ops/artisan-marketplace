import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"],
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Pottery",
        "Textiles",
        "Jewelry",
        "Woodwork",
        "Painting",
        "Metalwork",
        "Leather",
        "Bamboo & Cane",
        "Embroidery",
        "Other",
      ],
    },
    subCategory: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
      },
    ],
    artisan: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    tags: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        buyer: { type: Schema.Types.ObjectId, ref: "user" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    materials: {
      type: String,
      default: "",
    },
    dimensions: {
      type: String,
      default: "",
    },
    weight: {
      type: String,
      default: "",
    },
    handmade: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ProductModel = model("product", productSchema);