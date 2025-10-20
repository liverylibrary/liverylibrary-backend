import mongoose from "mongoose";

const aircraftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  manufacturer: { type: String },
  category: { type: String }, // e.g. Narrowbody, Widebody, Regional Jet
});

export default mongoose.model("Aircraft", aircraftSchema);
