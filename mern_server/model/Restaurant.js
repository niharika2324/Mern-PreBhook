import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  name:     String,
  location: String,
  cuisine:  String,
  image:    { type: String, default: "" },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  isApproved: {
    type: Boolean,
    default: false
  },

  maxCapacity: {
    type: Number,
    default: 40
  },

  ratingAverage: {
    type: Number,
    default: 0
  },

  ratingCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
