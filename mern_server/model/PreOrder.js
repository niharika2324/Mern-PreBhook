import mongoose from "mongoose";

const preOrderSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: false // Optional for direct orders
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: false
  },
  orderType: {
    type: String,
    enum: ["pre-order", "direct"],
    default: "pre-order"
  },
  items: [
    {
      menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: "pending" // can be "pending", "confirmed", etc.
  }
}, { timestamps: true });

const PreOrder = mongoose.model("PreOrder", preOrderSchema);

export default PreOrder;
