import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes.js";
import liveryRoutes from "./routes/liveryRoutes.js";
import userRoutes from "./routes/userRoutes.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("🚀 LiveryLibrary backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

app.use("/api/auth", authRoutes);
app.use("/api/liveries", liveryRoutes);
app.use("/uploads", express.static("uploads")); 
app.use("/api/users", userRoutes);
