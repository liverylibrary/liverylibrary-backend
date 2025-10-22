import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import liveryRoutes from "./routes/liveryRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    'https://liverylibrary.xyz',
    'https://www.liverylibrary.xyz'
  ],
  credentials: true,
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("🚀 LiveryLibrary backend is running on Render!");
});

app.use("/api/auth", authRoutes);
app.use("/api/liveries", liveryRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
