import mongoose from "mongoose";

const aircraftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer: { type: String },
  category: { type: String },
});

export default mongoose.model("Aircraft", aircraftSchema);
