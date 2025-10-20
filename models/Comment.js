import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  livery: { type: mongoose.Schema.Types.ObjectId, ref: "Livery", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Comment", commentSchema);
