import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["BUYER", "ARTISAN", "ADMIN"],
      required: [true, "Role is required"],
    },
    profileImageUrl: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Artisan-specific fields
    kycVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"],
      default: "NOT_SUBMITTED",
    },
    kycDocumentUrl: {
      type: String,
      default: "",
    },
    businessName: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    // Artisan story for "Story" section
    story: {
      type: String,
      default: "",
    },
    storyImageUrl: {
      type: String,
      default: "",
    },
    // Buyer-specific fields
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = model("user", userSchema);
