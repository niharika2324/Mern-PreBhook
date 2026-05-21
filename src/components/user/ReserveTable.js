import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.js";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const TIME_SLOTS = [
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
  "9:00 PM","9:30 PM","10:00 PM",
];

const ReserveTable = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({ date: "", time: "", guests: "2", phone: "" });
  const [loading, setLoading] = useState(false);
  const [fetchingRestaurant, setFetchingRestaurant] = useState(true);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/users/approved-restaurants")
      .then(res => {
        const found = (res.data?.data || []).find(r => r._id === restaurantId);
        setRestaurant(found || null);
      })
      .catch(() => setRestaurant(null))
      .finally(() => setFetchingRestaurant(false));
  }, [restaurantId]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.guests || !form.phone) return;
    setLoading(true);
    setStatus(null);
    setErrorMsg("");
    const toastId = toast.loading("Reserving your table...");
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      const res = await axiosInstance.post("/api/users/book-reservation", {
        restaurantId,
        userId: user?._id || user?.id || null,
        date: form.date, time: form.time,
        guests: Number(form.guests), phone: form.phone,
      });
      setStatus("success");
      toast.success("Reservation confirmed.", { id: toastId });
      const bookingId = res.data?.data?._id;
      if (bookingId) navigate(`/preorder/${bookingId}`, { state: { restaurantId } });
    } catch (err) {
      const msg = err?.response?.data?.message || "";
      if (msg.toLowerCase().includes("full")) {
        setStatus("full");
        toast.error("This slot is fully booked.", { id: toastId });
      }
      else {
        const finalMsg = msg || "Something went wrong. Please try again.";
        setStatus("error");
        setErrorMsg(finalMsg);
        toast.error(finalMsg, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (fetchingRestaurant) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080C12" }}>
      <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
    </div>
  );

  if (status === "success") return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080C12" }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="p-12 max-w-md w-full text-center rounded-[32px]"
        style={{ background: "#0E1520", border: "1px solid rgba(44,122,92,0.25)", boxShadow: "0 0 60px -10px rgba(44,122,92,0.2)" }}
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 success-pulse"
          style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)" }}>
          <svg className="w-10 h-10 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold text-white mb-3">Reservation Confirmed!</h2>
        <p className="text-text-secondary mb-2 leading-relaxed text-sm">
          Table for <strong className="text-white">{form.guests} guests</strong> at{" "}
          <strong className="text-white">{form.time}</strong> on{" "}
          <strong className="text-white">{form.date}</strong>
        </p>
        <p className="text-text-muted text-sm mb-8">SMS confirmation will be sent to {form.phone}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => { setStatus(null); setForm({ date:"", time:"", guests:"2", phone:"" }); }}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
            Make Another Reservation
          </button>
          <button onClick={() => navigate("/user/dashboard")}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-text-secondary transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#F1F5F9"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8B9CB5"; }}>
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen py-28 px-4 flex flex-col items-center" style={{ background: "#080C12" }}>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/user/dashboard")}
        className="self-start mb-10 text-sm font-semibold flex items-center gap-2 transition-colors"
        style={{ color: "#8B9CB5" }}
        onMouseEnter={e => e.currentTarget.style.color = "#F1F5F9"}
        onMouseLeave={e => e.currentTarget.style.color = "#8B9CB5"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Restaurants
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#C8A96A" }}>
          Reserve Your Experience
        </span>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">
          {restaurant?.name || "Book a Table"}
        </h1>
        {restaurant?.location && (
          <p className="text-text-secondary text-sm flex items-center justify-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.location}
            {restaurant.cuisine && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(200,169,106,0.12)", color: "#C8A96A", border: "1px solid rgba(200,169,106,0.2)" }}>
                {restaurant.cuisine}
              </span>
            )}
          </p>
        )}
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-[28px] p-8 md:p-10"
          style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.6)" }}>

          <AnimatePresence>
            {status === "full" && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <div>
                  <p className="font-bold text-red-400 text-sm">This slot is fully booked</p>
                  <p className="text-red-400/70 text-xs mt-0.5">Please choose a different time or date.</p>
                </div>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-400 text-sm">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Date</label>
              <input type="date" name="date" min={today} value={form.date} onChange={handleChange} required className="input-dark" />
            </div>

            {/* Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Time Slot</label>
              <div className="relative">
                <select name="time" value={form.time} onChange={handleChange} required className="select-dark w-full">
                  <option value="">Select a time slot</option>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B9CB5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Guests */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Number of Guests</label>
              <div className="relative">
                <select name="guests" value={form.guests} onChange={handleChange} required className="select-dark w-full">
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "Guest" : "Guests"}</option>
                  ))}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B9CB5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required className="input-dark" />
            </div>

            {/* Summary pill */}
            {form.date && form.time && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl flex items-center gap-3 text-sm"
                style={{ background: "rgba(44,122,92,0.1)", border: "1px solid rgba(44,122,92,0.2)" }}
              >
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ color: "#2C7A5C" }}>
                  {form.guests} guest{form.guests > 1 ? "s" : ""} · {form.time} · {form.date}
                  {restaurant?.name && ` · ${restaurant.name}`}
                </span>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming…</>
              ) : "Confirm Reservation"}
            </motion.button>
          </form>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs font-medium" style={{ color: "#4A5568" }}>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure Booking
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            SMS Confirmation
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Free Cancellation
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default ReserveTable;
