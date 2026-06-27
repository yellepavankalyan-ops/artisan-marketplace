import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { hash, compare } from "bcryptjs";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../config/multer.js";
const { sign } = jwt;
export const authApp = exp.Router();
config();

// Register User (BUYER or ARTISAN)
authApp.post("/register", upload.single("profileImageUrl"), async (req, res) => {
  // authApp.post("/register", async (req, res) => {
  try {
    console.log("BODY:", req.body);
console.log("FILE:", req.file);

    const allowedRoles = ["BUYER", "ARTISAN"];
    const newUser = req.body;

    if (!allowedRoles.includes(newUser.role)) {
      return res.status(400).json({ message: "Invalid role. Must be BUYER or ARTISAN." });
    }

    const existingUser = await UserModel.findOne({ email: newUser.email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    newUser.password = await hash(newUser.password, 12);

    if (req.file) {
      if (!req.file.path.startsWith("http://") && !req.file.path.startsWith("https://")) {
        const normalizedPath = req.file.path.replace(/\\/g, "/");
        newUser.profileImageUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;
      } else {
        newUser.profileImageUrl = req.file.path;
      }
    }

    const newUserDoc = new UserModel(newUser);
    await newUserDoc.save();

    res.status(201).json({ message: "Registration successful!" });
  }catch (error) {
  console.error("REGISTER ERROR:", error);
  res.status(500).json({
    message: "Error creating user",
    error: error.message,
  });
}
});

// Login
authApp.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Your account has been deactivated. Contact support." });
  }

  const isMatched = await compare(password, user.password);
  if (!isMatched) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const signedToken = sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      kycVerified: user.kycVerified,
      businessName: user.businessName,
    },
    process.env.SECRET_KEY,
    { expiresIn: "1d" }
  );

  res.cookie("token", signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  let userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({ message: "Login successful", payload: userObj });
});

// Logout
authApp.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logout successful" });
});

// Check auth on page refresh
authApp.get("/check-auth", verifyToken("BUYER", "ARTISAN", "ADMIN"), (req, res) => {
  res.status(200).json({ message: "Authenticated", payload: req.user });
});

// Change password
authApp.put("/password", verifyToken("BUYER", "ARTISAN", "ADMIN"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password cannot be the same as current password" });
    }

    const user = await UserModel.findById(req.user.id);
    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong current password" });
    }

    user.password = await hash(newPassword, 12);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Password update failed", error: err.message });
  }
});
