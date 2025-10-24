import mongoose from "mongoose";

const liverySchema = new mongoose.Schema({
  name: { type: String, required: true },
  aircraft: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: String,
  tags: [{ type: String }],
  decalIds: [{ type: String }],
  images: [{ type: String }],
  likes: [{ type: String }],
  comments: [
    {
      author: String,
      username: String,
      text: String,
      date: { type: Date, default: Date.now },
    },
  ],
  exclusive: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Livery", liverySchema);
