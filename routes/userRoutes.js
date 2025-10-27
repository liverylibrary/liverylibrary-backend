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

    user.avatarUrl = req.file.path;
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

    user.bannerUrl = req.file.path;
    await user.save();

    res.json({ message: "Banner updated successfully", bannerUrl: user.bannerUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload banner" });
  }
});

router.post("/profile/bio", verifyToken, async (req, res) => {
  try {
    const { bio } = req.body;
    if (typeof bio !== "string" || bio.length > 300)
      return res.status(400).json({ message: "Invalid bio length." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bio = bio.trim();
    await user.save();

    res.json({ message: "Bio updated successfully", bio: user.bio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update bio" });
  }
});


router.get("/top", async (req, res) => {
  try {
    const topCreators = await Livery.aggregate([
      { $group: { _id: "$author", totalLiveries: { $sum: 1 } } },
      { $sort: { totalLiveries: -1 } },
      { $limit: 6 },
    ]);

    const users = await Promise.all(
      topCreators.map(async (creator) => {
        const user = await User.findById(creator._id).select("username avatarUrl");
        return user
          ? {
              id: user._id,
              username: user.username,
              avatarUrl: user.avatarUrl || "",
              totalLiveries: creator.totalLiveries,
            }
          : null;
      })
    );

    res.json(users.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch top creators" });
  }
});


router.get("/search/:query", async (req, res) => {
  try {
    const regex = new RegExp(req.params.query, "i"); 
    const users = await User.find({ username: regex })
      .limit(8)
      .select("username avatarUrl");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search users" });
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


router.post("/:username/delete-avatar", verifyToken, async (req, res) => {
  const actingUser = req.user;
  if (!["admin", "moderator", "owner"].includes(actingUser.role))
    return res.status(403).json({ message: "Not authorized" });

  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.avatarUrl = "";
  await user.save();

  res.json({ message: "Avatar deleted successfully" });
});

router.post("/:username/delete-banner", verifyToken, async (req, res) => {
  const actingUser = req.user;
  if (!["admin", "moderator", "owner"].includes(actingUser.role))
    return res.status(403).json({ message: "Not authorized" });

  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.bannerUrl = "";
  await user.save();

  res.json({ message: "Banner deleted successfully" });
});

router.post("/:username/change-username", verifyToken, async (req, res) => {
  const actingUser = req.user;
  const { newUsername } = req.body;
  if (!["admin", "moderator", "owner"].includes(actingUser.role))
    return res.status(403).json({ message: "Not authorized" });

  if (!newUsername || newUsername.trim().length < 3)
    return res.status(400).json({ message: "Invalid username" });

  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ message: "User not found" });

  const existing = await User.findOne({ username: newUsername });
  if (existing)
    return res.status(400).json({ message: "Username already taken" });

  user.username = newUsername.trim();
  await user.save();

  res.json({ message: "Username changed successfully" });
});



export default router;
