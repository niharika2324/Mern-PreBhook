import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../../utils/axios.js";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { apiUrl, assetUrl } from "../../config/api.js";

const TIME_SLOTS = [
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
  "9:00 PM","9:30 PM","10:00 PM",
];

const CUISINE_FALLBACKS = {
  indian:   "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80",
  japanese: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80",
  italian:  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
  default:  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
};

/* ── Steps ── */
const STEPS = [
  { id: 1, label: "Choose Dishes" },
  { id: 2, label: "Pay & Book" },
  { id: 3, label: "Confirmed" },
];

const TABLE_RESERVATION_FEE = 100;

/* ── Dynamically load Razorpay checkout script ── */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RestaurantDetail = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);           // 1 = menu, 2 = booking form, 3 = success

  /* Cart */
  const [cart, setCart] = useState([]);

  /* Booking form */
  const [form, setForm] = useState({ date: "", time: "", guests: "2", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [completedBooking, setCompletedBooking] = useState(null);
  const [aiBookingNotice, setAiBookingNotice] = useState(null);

  /* Active menu category */
  const [activeCategory, setActiveCategory] = useState("All");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const draft = location.state?.aiBookingDraft;
    if (!draft) return;
    setForm(prev => ({
      ...prev,
      date: draft.date || prev.date,
      time: draft.time || prev.time,
      guests: draft.guests || prev.guests,
      phone: draft.phone || prev.phone,
    }));
    setAiBookingNotice(draft);
    if (draft.startAtPayment) setStep(2);
    toast.success("AI Concierge sent you to payment. Booking confirms only after payment.");
    window.history.replaceState({}, document.title);
  }, [location.state]);

  /* ── Fetch restaurant + menu ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, mRes, reviewRes] = await Promise.all([
          axios.get(apiUrl("/api/users/approved-restaurants")),
          axios.get(apiUrl(`/api/users/menu/${restaurantId}`)),
          axios.get(apiUrl(`/api/users/reviews/restaurant/${restaurantId}`))
        ]);
        const found = (rRes.data?.data || []).find(r => r._id === restaurantId);
        setRestaurant(found || null);
        setMenu(mRes.data?.data || []);
        setReviews(reviewRes.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [restaurantId]);

  /* ── Cart helpers ── */
  const updateQty = (item, delta) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuId === item._id);
      if (!existing) {
        if (delta > 0) return [...prev, { menuId: item._id, name: item.name, price: item.price, quantity: 1 }];
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(c => c.menuId !== item._id);
      return prev.map(c => c.menuId === item._id ? { ...c, quantity: newQty } : c);
    });
  };

  const getQty = (id) => cart.find(c => c.menuId === id)?.quantity || 0;

  const totalAmount = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const totalItems  = useMemo(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);
  const checkoutSubtotal = cart.length > 0 ? totalAmount : TABLE_RESERVATION_FEE;
  const checkoutTotal = Math.round(checkoutSubtotal * 1.05);

  /* ── Categories ── */
  const categories = useMemo(() => {
    const cats = ["All", ...Array.from(new Set(menu.map(m => m.category).filter(Boolean)))];
    return cats;
  }, [menu]);

  const filteredMenu = activeCategory === "All"
    ? menu
    : menu.filter(m => m.category === activeCategory);

  /* ── Submit: Razorpay payment → verify → booking + pre-order ── */
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.guests || !form.phone) return;

    setSubmitting(true);
    setBookingError("");

    try {
      const user   = JSON.parse(localStorage.getItem("currentUser") || "null");
      const userId = user?._id || user?.id || null;

      // Step 1: Create Razorpay order on our backend
      const orderRes = await axiosInstance.post("/api/users/create-payment-order", {
        amount: checkoutTotal,
      });

      if (!orderRes.data?.success) throw new Error("Could not initiate payment.");

      const { orderId, amount: rzpAmount, currency, keyId } = orderRes.data;

      // Step 2: Load Razorpay script and open modal
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setBookingError("Could not load payment gateway. Please check your connection and try again.");
        setSubmitting(false);
        return;
      }

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         keyId,
          amount:      rzpAmount,
          currency,
          order_id:    orderId,
          name:        "PreBhookh",
          description: `Table booking at ${restaurant?.name}`,
          image:       "",
          prefill: {
            contact: form.phone,
            email:   user?.email || "",
          },
          theme: { color: "#2C7A5C" },

          handler: async (paymentResponse) => {
            // Step 3: Verify payment and create booking + pre-order in one shot
            try {
              const verifyRes = await axiosInstance.post("/api/users/verify-booking-payment", {
                razorpay_order_id:   paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature:  paymentResponse.razorpay_signature,
                restaurantId,
                userId,
                date:        form.date,
                time:        form.time,
                guests:      Number(form.guests),
                phone:       form.phone,
                items:       cart,
                totalAmount: checkoutTotal,
              });

              if (!verifyRes.data?.success) throw new Error(verifyRes.data?.message || "Verification failed.");

              setCompletedBooking({
                bookingId:  verifyRes.data.data.booking._id,
                restaurant: restaurant?.name,
                date:       form.date,
                time:       form.time,
                guests:     form.guests,
                phone:      form.phone,
                items:      cart,
                total:      checkoutSubtotal,
                paymentId:  paymentResponse.razorpay_payment_id,
              });
              toast.success("Payment complete. Waiting for restaurant acceptance.");
              setStep(3);
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },

          modal: {
            ondismiss: () => {
              // User closed the modal without paying
              reject(new Error("Payment cancelled."));
            },
          },
        });

        rzp.open();
      });

    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "";
      if (msg.toLowerCase().includes("cancelled")) {
        setBookingError("Payment was cancelled. You have not been charged.");
      } else if (msg.toLowerCase().includes("full")) {
        setBookingError("This time slot is fully booked. Please choose a different time or date.");
      } else {
        setBookingError(msg || "Payment failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080C12" }}>
      <div className="w-10 h-10 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
    </div>
  );

  /* ── Step 3: Success screen ── */
  if (step === 3 && completedBooking) {
    const tax = completedBooking.total * 0.05;
    const finalTotal = completedBooking.total + tax;
    const hasFoodOrder = completedBooking.items.length > 0;
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "#080C12" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="max-w-md w-full"
        >
          <div className="rounded-[28px] overflow-hidden"
            style={{ background: "#0E1520", border: "1px solid rgba(44,122,92,0.3)", boxShadow: "0 0 60px -10px rgba(44,122,92,0.25)" }}>

            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 success-pulse"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-white mb-1">Booking Confirmed!</h2>
              <p className="text-sm" style={{ color: "#8B9CB5" }}>
                {hasFoodOrder ? "Your table and food order are all set." : "Your paid table reservation is all set."}
              </p>
            </div>

            {/* Booking details */}
            <div className="px-8 py-5" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#C8A96A" }}>Reservation Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Restaurant", completedBooking.restaurant],
                  ["Date", completedBooking.date],
                  ["Time", completedBooking.time],
                  ["Guests", `${completedBooking.guests} people`],
                  ["Phone", completedBooking.phone],
                  ["Payment", "Paid via Razorpay ✓"],
                  ["Status", "Pending restaurant acceptance"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs" style={{ color: "#4A5568" }}>{label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment summary */}
            <div className="px-8 py-5" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#C8A96A" }}>
                {hasFoodOrder ? "Pre-Order Summary" : "Payment Summary"}
              </p>
              <div className="space-y-2.5">
                {hasFoodOrder ? (
                  completedBooking.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.quantity}× {item.name}</span>
                      <span className="text-white font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Table reservation fee</span>
                    <span className="text-white font-medium">₹{completedBooking.total}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs pt-2" style={{ color: "#4A5568", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-8 py-4" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <span className="text-sm font-bold text-white uppercase tracking-wide">Total</span>
              <span className="font-serif text-2xl font-bold" style={{ color: "#C8A96A" }}>₹{finalTotal.toFixed(2)}</span>
            </div>

            <div className="p-6 space-y-3">
              <button onClick={() => navigate("/user/bookings")}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
                View My Bookings
              </button>
              <button onClick={() => navigate("/restaurants")}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9CB5" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#F1F5F9"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8B9CB5"; }}>
                Browse More Restaurants
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Restaurant not found ── */
  if (!restaurant) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: "#080C12" }}>
      <span className="text-5xl opacity-30">🔍</span>
      <h2 className="font-serif text-2xl font-bold text-white">Restaurant not found</h2>
      <button onClick={() => navigate("/restaurants")}
        className="px-6 py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
        Back to Restaurants
      </button>
    </div>
  );

  const coverImg = restaurant.image
    ? assetUrl(restaurant.image)
    : (CUISINE_FALLBACKS[(restaurant.cuisine || "").toLowerCase()] || CUISINE_FALLBACKS.default);

  /* ════════════════════════════════════════════════════
     MAIN LAYOUT
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#080C12" }}>

      {/* ── RESTAURANT HEADER BANNER ── */}
      <div className="relative h-52 md:h-72 w-full overflow-hidden mt-16">
        <img src={coverImg} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,12,18,0.3), rgba(8,12,18,0.9))" }} />
        <div className="absolute bottom-0 left-0 px-5 md:px-10 pb-6">
          <div className="flex items-end gap-4">
            <button onClick={() => navigate("/restaurants")}
              className="flex items-center gap-1.5 text-xs font-semibold mb-3 self-start transition-colors"
              style={{ color: "#8B9CB5" }}
              onMouseEnter={e => e.currentTarget.style.color = "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.color = "#8B9CB5"}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              All Restaurants
            </button>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight">{restaurant.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {restaurant.cuisine && <span className="badge badge-gold">{restaurant.cuisine}</span>}
            {restaurant.location && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#8B9CB5" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {restaurant.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#C8A96A" }}>
              ★ {restaurant.ratingAverage ? restaurant.ratingAverage.toFixed(1) : "New"}
              {restaurant.ratingCount > 0 && <span style={{ color: "#8B9CB5" }}>({restaurant.ratingCount} reviews)</span>}
            </span>
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ── */}
      <div className="px-5 md:px-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 py-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id ? "text-white" : step === s.id ? "text-white" : ""
                }`} style={{
                  background: step > s.id
                    ? "#2C7A5C"
                    : step === s.id
                    ? "linear-gradient(135deg, #2C7A5C, #3A9970)"
                    : "rgba(255,255,255,0.08)",
                  color: step >= s.id ? "#fff" : "#4A5568",
                  boxShadow: step === s.id ? "0 0 0 3px rgba(44,122,92,0.25)" : "none"
                }}>
                  {step > s.id
                    ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    : s.id}
                </div>
                <span className="text-sm font-semibold hidden sm:block" style={{ color: step >= s.id ? "#F1F5F9" : "#4A5568" }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ background: step > s.id ? "#2C7A5C" : "rgba(255,255,255,0.08)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ════ STEP 1: MENU + CART SIDEBAR ════ */}
      {step === 1 && (
        <div className="px-5 md:px-10 max-w-7xl mx-auto pb-32 flex flex-col lg:flex-row gap-8 items-start">

          {/* Menu */}
          <div className="flex-1 min-w-0">
            {aiBookingNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl"
                style={{ background: "rgba(44,122,92,0.1)", border: "1px solid rgba(44,122,92,0.24)", boxShadow: "0 18px 45px -28px rgba(44,122,92,0.7)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#2C7A5C" }}>
                  AI Concierge Handoff
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#8B9CB5" }}>
                  Your details are ready for <span className="font-semibold text-white">{aiBookingNotice.restaurantName || restaurant?.name}</span>.
                  Complete Razorpay payment to confirm the table. You can add food first, or pay the table reservation fee without a pre-order.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    ["Date", aiBookingNotice.date],
                    ["Time", aiBookingNotice.time],
                    ["Guests", aiBookingNotice.guests],
                    ["Phone", aiBookingNotice.phone],
                  ].map(([label, value]) => (
                    <span key={label} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#F1F5F9", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {label}: {value}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Category filter */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-6 hide-scrollbar">
                {categories.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize transition-all flex-shrink-0"
                    style={{
                      background: activeCategory === c ? "#2C7A5C" : "rgba(255,255,255,0.04)",
                      color: activeCategory === c ? "#fff" : "#8B9CB5",
                      border: activeCategory === c ? "1px solid rgba(44,122,92,0.5)" : "1px solid rgba(255,255,255,0.07)"
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {menu.length === 0 ? (
              <div className="py-20 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <span className="text-4xl block mb-3 opacity-30">🍽️</span>
                <p className="text-text-secondary font-serif text-lg">Menu coming soon.</p>
                <p className="text-xs text-text-muted mt-1">The restaurant hasn't uploaded their menu yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenu.map((item, idx) => {
                  const qty = getQty(item._id);
                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex gap-4 p-4 rounded-[20px] transition-all"
                      style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(44,122,92,0.25)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                    >
                      <div className="w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <img
                          src={assetUrl(item.image)}
                          alt={item.name}
                          onError={e => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-bold text-white text-sm leading-snug mb-1">{item.name}</h3>
                          {item.category && (
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full font-medium inline-block mb-1.5"
                              style={{ background: "rgba(255,255,255,0.06)", color: "#4A5568" }}>{item.category}</span>
                          )}
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#4A5568" }}>{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-serif font-bold text-base" style={{ color: "#C8A96A" }}>₹{item.price}</span>
                          {qty === 0 ? (
                            <button onClick={() => updateQty(item, 1)}
                              className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                              style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#2C7A5C"; e.currentTarget.style.color = "#fff"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(44,122,92,0.15)"; e.currentTarget.style.color = "#2C7A5C"; }}>
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center rounded-xl overflow-hidden" style={{ background: "#2C7A5C" }}>
                              <button onClick={() => updateQty(item, -1)} className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-black/20 transition-colors">−</button>
                              <span className="w-7 text-center text-white font-bold text-sm">{qty}</span>
                              <button onClick={() => updateQty(item, 1)} className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-black/20 transition-colors">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── DESKTOP CART SIDEBAR ── */}
          <aside className="w-full lg:w-[340px] flex-shrink-0 sticky top-24 hidden lg:block">
            <div className="rounded-[24px] p-6 flex flex-col"
              style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between pb-5 mb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-serif text-xl font-bold text-white">Your Order</h3>
                {totalItems > 0 && (
                  <span className="badge badge-green">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 min-h-[120px] max-h-[45vh]" style={{ scrollbarWidth: "none" }}>
                {cart.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center gap-2 opacity-40">
                    <span className="text-3xl">🛒</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted text-center">
                      Add dishes to get started
                    </p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.menuId} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs" style={{ color: "#C8A96A" }}>₹{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-medium text-sm text-white">₹{item.price * item.quantity}</span>
                        <button onClick={() => updateQty({ _id: item.menuId }, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#8B9CB5" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                          onMouseLeave={e => e.currentTarget.style.color = "#8B9CB5"}>
                          −
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Subtotal</span>
                    <span className="font-serif text-xl font-bold" style={{ color: "#C8A96A" }}>₹{totalAmount}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-2"
                style={{
                  background: "linear-gradient(135deg, #2C7A5C, #3A9970)",
                  boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)"
                }}>
                Proceed to Payment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>

              <p className="text-center text-xs mt-3" style={{ color: "#4A5568" }}>
                Table confirms only after Razorpay payment succeeds
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* ════ STEP 2: BOOKING FORM ════ */}
      {step === 2 && (
        <div className="px-5 md:px-10 max-w-5xl mx-auto pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Left: Form */}
            <div className="lg:col-span-3">
              <h2 className="font-serif text-2xl font-bold text-white mb-1">Reserve Your Table</h2>
              <p className="text-sm text-text-secondary mb-6">Fill in your details to complete the booking.</p>

              {bookingError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{bookingError}</p>
                </motion.div>
              )}

              <form onSubmit={handleConfirmBooking} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Date *</label>
                    <input type="date" min={today} value={form.date}
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                      required className="input-dark" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Time Slot *</label>
                    <div className="relative">
                      <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                        required className="select-dark w-full">
                        <option value="">Select a time slot</option>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B9CB5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Number of Guests *</label>
                    <div className="relative">
                      <select value={form.guests} onChange={e => setForm(p => ({ ...p, guests: e.target.value }))}
                        required className="select-dark w-full">
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "Guest" : "Guests"}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B9CB5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Phone Number *</label>
                    <input type="tel" value={form.phone} placeholder="+91 98765 43210"
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      required className="input-dark" />
                  </div>
                </div>

                {/* Booking summary pill */}
                {form.date && form.time && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 rounded-xl flex items-center gap-3 text-sm"
                    style={{ background: "rgba(44,122,92,0.08)", border: "1px solid rgba(44,122,92,0.2)" }}>
                    <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: "#2C7A5C" }}>
                      {form.guests} guest{form.guests > 1 ? "s" : ""} · {form.time} · {form.date} · {restaurant.name}
                    </span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setStep(1); setBookingError(""); }}
                    className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9CB5" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#F1F5F9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8B9CB5"; }}>
                    {cart.length > 0 ? "← Edit Food" : "Add Food"}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pay ₹{checkoutTotal} & Confirm
                      </>
                    )}
                  </button>
                </div>

                {/* Razorpay trust badge */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <svg className="w-3.5 h-3.5" style={{ color: "#4A5568" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: "#4A5568" }}>
                    Secured by Razorpay · 5% GST included · SMS Confirmation
                  </span>
                </div>
              </form>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="rounded-[22px] p-5 sticky top-24"
                style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="font-serif text-lg font-bold text-white mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  Payment Summary
                </h3>
                <div className="space-y-3 mb-4">
                  {cart.length > 0 ? (
                    cart.map(item => (
                      <div key={item.menuId} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{item.quantity}× {item.name}</span>
                        <span className="text-white font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Table reservation fee</span>
                      <span className="text-white font-medium">₹{TABLE_RESERVATION_FEE}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-4" style={{ borderTop: "1px dashed rgba(255,255,255,0.08)" }}>
                  <span className="text-sm font-bold uppercase tracking-wider text-white">Subtotal</span>
                  <span className="font-serif text-xl font-bold" style={{ color: "#C8A96A" }}>₹{checkoutSubtotal}</span>
                </div>
                <p className="text-xs mt-3" style={{ color: "#4A5568" }}>
                  + 5% tax applied at checkout. {cart.length > 0 ? "Food will be ready on arrival." : "Booking confirms only after payment succeeds."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 md:px-10 max-w-7xl mx-auto pb-16">
        <div className="rounded-[24px] p-6 md:p-8" style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C8A96A" }}>Guest Reviews</p>
              <h2 className="font-serif text-2xl font-bold text-white">
                {restaurant.ratingAverage ? `${restaurant.ratingAverage.toFixed(1)} out of 5` : "No ratings yet"}
              </h2>
            </div>
            <p className="text-sm" style={{ color: "#8B9CB5" }}>
              {restaurant.ratingCount || 0} verified review{restaurant.ratingCount === 1 ? "" : "s"}
            </p>
          </div>

          {reviews.length === 0 ? (
            <div className="py-10 text-center rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-sm text-text-secondary">Reviews will appear here after guests complete a booking and rate their visit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.slice(0, 6).map(review => (
                <div key={review._id} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold text-white text-sm">{review.userId?.name || "Guest"}</p>
                    <span className="text-sm font-bold" style={{ color: "#C8A96A" }}>★ {review.rating}/5</span>
                  </div>
                  {review.comment && <p className="text-sm leading-relaxed" style={{ color: "#8B9CB5" }}>{review.comment}</p>}
                  <p className="text-xs mt-3" style={{ color: "#4A5568" }}>
                    {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE FLOATING CART BAR (Step 1 only) ── */}
      <AnimatePresence>
        {step === 1 && cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
            <div className="rounded-2xl flex items-center justify-between p-4"
              style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px -5px rgba(0,0,0,0.7)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#2C7A5C" }}>
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </p>
                <p className="font-serif font-bold text-xl" style={{ color: "#C8A96A" }}>₹{totalAmount}</p>
              </div>
              <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                Book Table →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetail;
