import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["member", "verified", "tester", "contributor", "moderator", "admin", "affiliate", "owner",],
    default: "member",
  },
  avatarUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" }, 
  bio: { type: String, maxlength: 300 },
  dateJoined: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
