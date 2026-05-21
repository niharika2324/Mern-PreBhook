import crypto from "crypto";
import Razorpay from "razorpay";
import Booking from "../model/Booking.js";
import PreOrder from "../model/PreOrder.js";
import Restaurant from "../model/Restaurant.js";

const BOOKING_TRANSITIONS = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

const sendSMS = (phone, message) => console.log(`[SMS → ${phone}]: ${message}`);

// ── Helper: get Razorpay instance ─────────────────────────────────────────────
const getRazorpay = () =>
  new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// ── POST /api/users/create-payment-order ──────────────────────────────────────
// Frontend sends { amount } in rupees; we create a Razorpay order and return orderId
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: "Valid amount is required." });

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount:   Math.round(Number(amount) * 100), // paise
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createPaymentOrder error:", error);
    return res.status(500).json({ success: false, message: "Could not create payment order." });
  }
};

// ── POST /api/users/verify-booking-payment ────────────────────────────────────
// Verifies Razorpay signature, then creates Booking + PreOrder atomically
export const verifyAndConfirmBooking = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      restaurantId,
      userId,
      date, time, guests, phone,
      items,       // cart items [{menuId, name, price, quantity}]
      totalAmount, // rupees (food + tax)
    } = req.body;

    // 1. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed. Please contact support." });
    }

    // 2. Validate required booking fields
    if (!restaurantId || !date || !time || !guests || !phone)
      return res.status(400).json({ success: false, message: "All booking fields are required." });

    // 3. Find restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found." });

    // 4. Capacity check
    const existingBookings = await Booking.find({ restaurantId, date, time });
    const totalGuests = existingBookings.reduce((sum, b) => sum + b.guests, 0);
    if (totalGuests + Number(guests) > restaurant.maxCapacity) {
      // Payment was taken but slot is now full — in production you'd initiate a refund here
      return res.status(400).json({
        success: false,
        message: "This slot just became fully booked. A refund will be processed automatically.",
      });
    }

    // 5. Save Booking with payment proof
    const booking = new Booking({
      restaurantId,
      userId:        userId || null,
      date,
      time,
      guests:        Number(guests),
      phone,
      status:        "pending",
      paymentStatus: "completed",
      paymentId:     razorpay_payment_id,
      orderId:       razorpay_order_id,
      totalAmount:   Number(totalAmount) || 0,
    });
    await booking.save();

    // 6. Save PreOrder linked to this booking
    let preOrder = null;
    if (items && items.length > 0) {
      preOrder = new PreOrder({
        bookingId:    booking._id,
        restaurantId,
        userId:       userId || null,
        orderType:    "pre-order",
        items,
        totalAmount:  Number(totalAmount) || 0,
        status:       "pending",
      });
      await preOrder.save();
    }

    // 7. Mock SMS confirmation
    sendSMS(phone, `Payment received! Your table request for ${guests} guests at ${time} on ${date} at ${restaurant.name} is waiting for restaurant acceptance.`);

    return res.status(201).json({
      success: true,
      message: "Payment verified. Booking is waiting for restaurant acceptance.",
      data:    { booking, preOrder },
    });
  } catch (error) {
    console.error("verifyAndConfirmBooking error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please contact support." });
  }
};

// ── POST /api/users/book-reservation (legacy — kept for backward compat) ──────
export const bookReservation = async (req, res) => {
  try {
    const { restaurantId, userId, date, time, guests, phone } = req.body;

    if (!restaurantId || !date || !time || !guests || !phone)
      return res.status(400).json({ success: false, message: "All fields are required." });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(404).json({ success: false, message: "Restaurant not found." });

    const existingBookings = await Booking.find({ restaurantId, date, time });
    const totalGuests = existingBookings.reduce((sum, b) => sum + b.guests, 0);

    if (totalGuests + Number(guests) > restaurant.maxCapacity)
      return res.status(400).json({ success: false, message: "This slot is fully booked. Please choose a different time or date." });

    const booking = new Booking({
      restaurantId, userId: userId || null,
      date, time, guests: Number(guests), phone,
      status: "pending",
    });
    await booking.save();

    sendSMS(phone, `Your reservation request for ${guests} guests at ${time} on ${date} at ${restaurant.name} is waiting for restaurant acceptance.`);

    return res.status(201).json({ success: true, message: "Reservation request created.", data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};

// ── GET /api/users/bookings/:restaurantId ─────────────────────────────────────
export const getBookingsByRestaurant = async (req, res) => {
  try {
    const bookings = await Booking.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/users/bookings/user/:userId ──────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId).populate("restaurantId", "name ownerId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const ownerId = String(booking.restaurantId?.ownerId || "");
    const requesterId = String(req.user?.id || "");
    if (req.user?.role !== "admin" && ownerId !== requesterId) {
      return res.status(403).json({ success: false, message: "You can manage bookings only for your restaurant." });
    }

    const currentStatus = booking.status || "pending";
    const allowed = BOOKING_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move booking from ${currentStatus} to ${status}.`,
      });
    }

    booking.status = status;
    await booking.save();

    const statusMessages = {
      accepted: "accepted your booking",
      preparing: "started preparing your table/order",
      ready: "marked your table/order ready",
      completed: "completed your visit",
      cancelled: "cancelled your booking",
    };
    sendSMS(booking.phone, `${booking.restaurantId.name} has ${statusMessages[status]}.`);

    return res.status(200).json({ success: true, message: "Booking status updated.", data: booking });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return res.status(500).json({ success: false, message: "Could not update booking status." });
  }
};

export const getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate("restaurantId", "name location image")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
