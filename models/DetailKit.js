import mongoose from "mongoose";

const detailKitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    aircraft: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    downloadLink: { type: String, required: true },
    exclusive: { type: Boolean, default: false },
    images: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
        text: String,
        date: { type: Date, default: Date.now },
      },
    ],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("DetailKit", detailKitSchema);
