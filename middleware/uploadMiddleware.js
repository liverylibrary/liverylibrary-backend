import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// --- CLOUDINARY STORAGE ENGINE ---
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Optional: separate folders by route context
    const folder = req.baseUrl.includes("liveries")
      ? "liverylibrary/liveries"
      : "liverylibrary/users";

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// --- EXPORT MULTER WRAPPER ---
export const upload = multer({ storage });
