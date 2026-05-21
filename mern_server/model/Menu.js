import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  image: {
    type: String
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  }

}, { timestamps: true });

export default mongoose.model("Menu", menuSchema);