import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import User from "../models/User.js";
import Livery from "../models/Livery.js";

const router = express.Router();

router.post("/profile/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatarUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Avatar updated successfully", avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
});

router.post("/profile/banner", verifyToken, upload.single("banner"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bannerUrl = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Banner updated successfully", bannerUrl: user.bannerUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload banner" });
  }
});


router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-passwordHash -email");

    if (!user) return res.status(404).json({ message: "User not found" });

    const liveries = await Livery.find({ author: user._id })
      .sort({ createdAt: -1 })
      .select("name images aircraft createdAt");

    res.json({ user, liveries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});




export default router;
