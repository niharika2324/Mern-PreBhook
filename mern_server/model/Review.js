import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
}, { timestamps: true });

reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, restaurantId: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
