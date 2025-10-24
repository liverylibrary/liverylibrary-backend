import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import Livery from "../models/Livery.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const liveries = await Livery.find({})
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(liveries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent liveries" });
  }
});

router.get("/author/:authorId/:excludeId", async (req, res) => {
  try {
    const { authorId, excludeId } = req.params;

    const filter = { author: authorId };
    if (excludeId && excludeId !== "undefined") filter._id = { $ne: excludeId };

    const liveries = await Livery.find(filter)
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name images aircraft createdAt");

    res.json(liveries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch author's liveries" });
  }
});

router.post("/", verifyToken, upload.array("images", 5), async (req, res) => {
  try {
    const { name, aircraft, description, tags, decalIds, exclusive } = req.body;
    const imagePaths = req.files.map((file) => file.path);

    const livery = new Livery({
      name,
      aircraft,
      description,
      exclusive: exclusive === "true",
      tags: JSON.parse(tags || "[]"),
      decalIds: JSON.parse(decalIds || "[]"),
      images: imagePaths,
      author: req.user.id,
    });

    await livery.save();
    res.status(201).json({ message: "Livery uploaded successfully", livery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
});



router.get("/", async (req, res) => {
  try {
    const { aircraft, tag, search, page = 1, limit = 9 } = req.query;
    const query = {};

    if (aircraft) query.aircraft = aircraft;
    if (tag) query.tags = { $in: [tag] };
    if (search) query.name = { $regex: search, $options: "i" };

    const limitNum = Math.min(parseInt(limit) || 9, 50);
    const total = await Livery.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    const currentPage = Math.min(
      Math.max(parseInt(page) || 1, 1),
      totalPages || 1
    );

    const liveries = await Livery.find(query)
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limitNum)
      .limit(limitNum);

    res.json({
      data: liveries,
      total,
      totalPages,
      currentPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch liveries" });
  }
});

router.get("/my", verifyToken, async (req, res) => {
  try {
    const liveries = await Livery.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .select("name aircraft images createdAt");

    res.json(liveries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user's liveries" });
  }
});

router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const livery = await Livery.findById(req.params.id);
    if (!livery) return res.status(404).json({ message: "Livery not found" });

    if (!livery.likes) livery.likes = [];

    const userId = req.user.id;
    const index = livery.likes.indexOf(userId);

    if (index > -1) {
      livery.likes.splice(index, 1); 
    } else {
      livery.likes.push(userId); 
    }

    await livery.save();
    res.json({ likes: livery.likes.length, liked: index === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error toggling like" });
  }
});

router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const livery = await Livery.findById(req.params.id);
    if (!livery) return res.status(404).json({ message: "Livery not found" });

    const comment = {
      author: req.user.id,
      username: req.user.username,
      text,
      date: new Date(),
    };

    if (!livery.comments) livery.comments = [];
    livery.comments.push(comment);

    await livery.save();
    res.json(livery.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const livery = await Livery.findById(req.params.id);
    if (!livery) return res.status(404).json({ message: "Livery not found" });

    if (livery.author.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await livery.deleteOne();
    res.json({ message: "Livery deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete livery" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const livery = await Livery.findById(req.params.id)
      .populate("author", "username")
      .exec();

    if (!livery) return res.status(404).json({ message: "Livery not found" });
    res.json(livery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching livery" });
  }
});

export default router;