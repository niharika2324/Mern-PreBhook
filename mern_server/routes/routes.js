import express from 'express';
import { registerUser, loginUser, verifyOTP, resendOTP, getAllUsers, deleteUser, updateUser } from '../controllers/UserController.js';
import {
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  approveRestaurant,
  getApprovedRestaurants,
  getRestaurantByOwner
} from "../controllers/RestaurantController.js";
import { addMenu, updateMenu, deleteMenu, getMenuByRestaurant } from "../controllers/MenuController.js";
import { addTable, getTablesByRestaurant, bookTable, resetTable } from "../controllers/TableController.js";
import { bookReservation, createPaymentOrder, verifyAndConfirmBooking, getBookingsByRestaurant, getBookingsByUser, updateBookingStatus } from "../controllers/BookingController.js";
import { createOrUpdateReview, getReviewsByRestaurant, getReviewsByUser } from "../controllers/ReviewController.js";
import { upload } from "../middlewares/upload.js";
import { authenticateToken, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.get("/approved-restaurants", getApprovedRestaurants);
router.get("/menu/:restaurantId", getMenuByRestaurant);

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT — Admin only
// ─────────────────────────────────────────────────────────────
router.get('/all',                authenticateToken, authorizeRole('admin'), getAllUsers);
router.delete('/delete-user/:id', authenticateToken, authorizeRole('admin'), deleteUser);
router.put('/update-user/:id',    authenticateToken, authorizeRole('admin'), updateUser);

// ─────────────────────────────────────────────────────────────
// RESTAURANT MANAGEMENT
// ─────────────────────────────────────────────────────────────
// Owner/Admin: add restaurant (with image)
router.post("/add-restaurant",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  upload.single("image"),
  addRestaurant
);

// Owner/Admin: update restaurant (with optional new image)
router.put("/update-restaurant/:id",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  upload.single("image"),
  updateRestaurant
);

// Owner/Admin: delete restaurant
router.delete("/delete-restaurant/:id",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  deleteRestaurant
);

router.get("/restaurants/owner/:ownerId", authenticateToken, getRestaurantByOwner);

// Admin only
router.get("/all-restaurants",           authenticateToken, authorizeRole('admin'), getAllRestaurants);
router.put("/approve-restaurant/:id",    authenticateToken, authorizeRole('admin'), approveRestaurant);

// ─────────────────────────────────────────────────────────────
// MENU MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.post("/add-menu",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  upload.single("image"),
  addMenu
);

router.put("/update-menu/:id",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  upload.single("image"),
  updateMenu
);

router.delete("/delete-menu/:id",
  authenticateToken,
  authorizeRole('owner', 'admin'),
  deleteMenu
);

// ─────────────────────────────────────────────────────────────
// TABLE MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.post("/add-table",           authenticateToken, authorizeRole('owner', 'admin'), addTable);
router.get("/tables/:restaurantId", authenticateToken, getTablesByRestaurant);
router.put("/book-table/:tableId",  authenticateToken, bookTable);
router.put("/reset-table/:tableId", authenticateToken, authorizeRole('owner', 'admin'), resetTable);

// ─────────────────────────────────────────────────────────────
// RESERVATION BOOKING
// ─────────────────────────────────────────────────────────────
router.post("/create-payment-order",          authenticateToken, createPaymentOrder);
router.post("/verify-booking-payment",        authenticateToken, verifyAndConfirmBooking);
router.post("/book-reservation",              authenticateToken, bookReservation);
router.get("/bookings/:restaurantId",         authenticateToken, authorizeRole('owner', 'admin'), getBookingsByRestaurant);
router.patch("/bookings/:bookingId/status",   authenticateToken, authorizeRole('owner', 'admin'), updateBookingStatus);
router.get("/bookings/user/:userId",          authenticateToken, getBookingsByUser);

// REVIEWS & RATINGS
router.post("/reviews",                       authenticateToken, authorizeRole('user'), createOrUpdateReview);
router.get("/reviews/restaurant/:restaurantId", getReviewsByRestaurant);
router.get("/reviews/user/:userId",           authenticateToken, getReviewsByUser);

export default router;
