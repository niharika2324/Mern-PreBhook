import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    enum: ["indoor", "outdoor", "vip"],
    default: "indoor"
  },
  status: {
    type: String,
    enum: ["available", "booked"],
    default: "available"
  }

}, { timestamps: true });

export default mongoose.model("Table", tableSchema);
