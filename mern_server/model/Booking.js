import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "user", required: false },
  date:         { type: String, required: true },
  time:         { type: String, required: true },
  guests:       { type: Number, required: true },
  phone:        { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "preparing", "ready", "completed", "cancelled"],
    default: "pending"
  },

  // Payment tracking
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paymentId:     { type: String, default: "" },   // Razorpay payment_id
  orderId:       { type: String, default: "" },   // Razorpay order_id
  totalAmount:   { type: Number, default: 0 },    // food total + 5% tax (rupees)
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
