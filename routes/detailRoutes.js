import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import DetailKit from "../models/DetailKit.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/* ------------------------- GET RECENT DETAIL KITS ------------------------- */
router.get("/recent", async (req, res) => {
  try {
    const kits = await DetailKit.find({})
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(kits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recent detail kits" });
  }
});

/* ------------------------- GET AUTHOR DETAIL KITS ------------------------- */
router.get("/author/:authorId/:excludeId", async (req, res) => {
  try {
    const { authorId, excludeId } = req.params;
    const filter = { author: authorId };
    if (excludeId && excludeId !== "undefined") filter._id = { $ne: excludeId };

    const kits = await DetailKit.find(filter)
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name images aircraft createdAt");

    res.json(kits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch author's detail kits" });
  }
});

/* --------------------------- UPLOAD NEW DETAIL KIT --------------------------- */
router.post("/", verifyToken, upload.array("images", 5), async (req, res) => {
  try {
    const { name, aircraft, description, tags, downloadLink, exclusive } = req.body;
    const imagePaths = req.files.map((file) => file.path);

    const kit = new DetailKit({
      name,
      aircraft,
      description,
      exclusive: exclusive === "true",
      tags: JSON.parse(tags || "[]"),
      downloadLink,
      images: imagePaths,
      author: req.user.id,
    });

    await kit.save();
    res.status(201).json({ message: "Detail kit uploaded successfully", kit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during detail kit upload" });
  }
});

/* ----------------------------- GET ALL DETAIL KITS ----------------------------- */
router.get("/", async (req, res) => {
  try {
    const { aircraft, tag, search, page = 1, limit = 9, sort = "newest" } = req.query;
    const query = {};

    if (aircraft) query.aircraft = { $regex: aircraft, $options: "i" };
    if (tag) query.tags = { $elemMatch: { $regex: tag, $options: "i" } };
    if (search) query.name = { $regex: search, $options: "i" };

    const limitNum = Math.min(parseInt(limit) || 9, 50);
    const total = await DetailKit.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    const currentPage = Math.min(Math.max(parseInt(page) || 1, 1), totalPages || 1);

    let sortQuery = { createdAt: -1 };
    if (sort === "mostLiked") sortQuery = { "likes.length": -1 };
    else if (sort === "mostCommented") sortQuery = { "comments.length": -1 };

    const kits = await DetailKit.find(query)
      .populate("author", "username avatarUrl")
      .sort(sortQuery)
      .skip((currentPage - 1) * limitNum)
      .limit(limitNum);

    res.json({
      data: kits,
      total,
      totalPages,
      currentPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch detail kits" });
  }
});

/* -------------------------- GET USER’S DETAIL KITS -------------------------- */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const kits = await DetailKit.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .select("name aircraft images createdAt");

    res.json(kits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user's detail kits" });
  }
});

/* --------------------------- LIKE / UNLIKE DETAIL KIT --------------------------- */
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const kit = await DetailKit.findById(req.params.id).populate("author");
    if (!kit) return res.status(404).json({ message: "Detail kit not found" });

    const userId = req.user.id;
    const hasLiked = kit.likes.includes(userId);

    const update = hasLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    await DetailKit.updateOne({ _id: kit._id }, update);

    if (!hasLiked && kit.author._id.toString() !== userId) {
      const existingNotif = await Notification.findOne({
        user: kit.author._id,
        type: "like",
        message: {
          $regex: `${req.user.username} liked your detail kit "${kit.name}"`,
          $options: "i",
        },
      });

      if (!existingNotif) {
        await Notification.create({
          user: kit.author._id,
          type: "like",
          message: `${req.user.username} liked your detail kit "${kit.name}"`,
          link: `/details/${kit._id}`,
        });
      }
    }

    const updated = await DetailKit.findById(kit._id).select("likes");
    res.json({ likes: updated.likes.length, liked: !hasLiked });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ message: "Error toggling like" });
  }
});

/* --------------------------- ADD COMMENT TO DETAIL KIT --------------------------- */
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const kit = await DetailKit.findById(req.params.id).populate("author");
    if (!kit) return res.status(404).json({ message: "Detail kit not found" });

    const comment = {
      author: req.user.id,
      username: req.user.username,
      text,
      date: new Date(),
    };

    if (!kit.comments) kit.comments = [];
    kit.comments.push(comment);
    await kit.save();

    if (kit.author._id.toString() !== req.user.id) {
      await Notification.create({
        user: kit.author._id,
        type: "comment",
        message: `${req.user.username} commented on your detail kit "${kit.name}"`,
        link: `/details/${kit._id}`,
      });
    }

    res.json(kit.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding comment" });
  }
});

/* --------------------------- DELETE DETAIL KIT --------------------------- */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const kit = await DetailKit.findById(req.params.id).populate("author");
    if (!kit) return res.status(404).json({ message: "Detail kit not found" });

    const userId = req.user.id;
    const actingUser = req.user;

    const allowedRoles = ["moderator", "admin", "owner"];
    const isAuthorized =
      kit.author._id.toString() === userId ||
      allowedRoles.includes(actingUser.role);

    if (!isAuthorized)
      return res.status(403).json({ message: "Unauthorized" });

    await kit.deleteOne();
    res.json({ message: "Detail kit deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete detail kit" });
  }
});

/* --------------------------- GET SINGLE DETAIL KIT --------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const kit = await DetailKit.findById(req.params.id)
      .populate("author", "username")
      .exec();

    if (!kit) return res.status(404).json({ message: "Detail kit not found" });
    res.json(kit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching detail kit" });
  }
});

export default router;
