import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/mark-read", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

router.delete("/clear", verifyToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

export default router;