import exp from "express";
import mongoose, { connect } from "mongoose";
import { authApp } from "./APIS/authapi.js";
import { buyerApp } from "./APIS/Buyerapi.js";
import { artisanApp } from "./APIS/Artisanapi.js";
import { adminApp } from "./APIS/Adminapi.js";
import { productApp } from "./APIS/Productapi.js";
import { orderApp } from "./APIS/Orderapi.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = exp();

// Required on Render/behind proxies so secure cookies & req.secure work correctly
app.set("trust proxy", 1);

// Enable CORS
const extraOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === "http://localhost:5173" ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        extraOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(exp.json({ limit: "10mb" }));

// Route level middlewares
app.use("/auth", authApp);
app.use("/buyer-api", buyerApp);
app.use("/artisan-api", artisanApp);
app.use("/admin-api", adminApp);
app.use("/product-api", productApp);
app.use("/order-api", orderApp);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Handicraft Marketplace API is running",
    routes: ["/auth", "/product-api", "/buyer-api", "/artisan-api", "/admin-api", "/order-api"],
  });
});

// Simple health check (useful for Render health checks / uptime monitors)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Connect to DB (with retries) and start the server
const PORT = process.env.PORT || 5000;
let dbConnected = false;

const connectDB = async (retries = 5, delayMs = 5000) => {
  if (dbConnected) return; // never run multiple retry chains at once

  if (!process.env.DB_URL) {
    console.log(
      "DB_URL is not set. Please set it in your .env file (or in Render's environment variables)."
    );
    return;
  }

  try {
    await connect(process.env.DB_URL);
    dbConnected = true;
    console.log("DB server connected");
  } catch (err) {
    console.log("Error in DB connect:", err.message || err);

    if (err.code === "ECONNREFUSED" && err.syscall === "querySrv") {
      console.log(
        "\nThis 'querySrv ECONNREFUSED _mongodb._tcp...' error is a DNS issue.\n" +
          "Try a standard (non +srv) connection string, switch DNS to 8.8.8.8, or check\n" +
          "that your network allows DNS SRV lookups.\n"
      );
    }

    if (err.name === "MongooseServerSelectionError") {
      console.log(
        "\nCould not reach the MongoDB Atlas cluster. Checklist:\n" +
          "  1. MongoDB Atlas -> Network Access -> add your current IP (or 0.0.0.0/0 for testing).\n" +
          "  2. MongoDB Atlas -> Database -> make sure the cluster is not paused.\n" +
          "  3. Double-check the username/password in DB_URL are correct.\n"
      );
    }

    if (retries > 0) {
      console.log(`Retrying DB connection in ${delayMs / 1000}s... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1, delayMs), delayMs);
    } else {
      console.log(
        "Giving up on DB connection for now. The server will keep running, " +
          "but routes that use the database will fail until the DB connects."
      );
    }
  }
};

mongoose.connection.on("disconnected", () => {
  if (!dbConnected) return; // ignore the initial-state event, only handle real drops
  dbConnected = false;
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectDB(5, 5000);
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

connectDB();

app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

// Handle invalid paths
app.use((req, res, next) => {
  res.status(404).json({ message: `Path ${req.url} is invalid` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.log("Error:", err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID", error: err.message });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "Duplicate entry",
      error: `${field} "${value}" already exists`,
    });
  }

  res.status(500).json({ message: "Server error occurred" });
});
