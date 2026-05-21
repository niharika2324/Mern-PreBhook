import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const UserBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reservations");
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch {}
    if (!currentUser) { navigate("/"); return; }
    setCurrentUser(currentUser);
    const userId = currentUser._id || currentUser.id;
    Promise.all([
      axiosInstance.get(`/api/users/bookings/user/${userId}`),
      axiosInstance.get(`/api/preorder/user/${userId}`),
      axiosInstance.get(`/api/users/reviews/user/${userId}`)
    ]).then(([bRes, oRes, rRes]) => {
      setBookings(bRes.data?.data || []);
      setOrders(oRes.data?.data || []);
      setReviews(rRes.data?.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const getReviewForBooking = (bookingId) => reviews.find(r => String(r.bookingId) === String(bookingId));

  const openReviewModal = (booking) => {
    const existing = getReviewForBooking(booking._id);
    setReviewModal(booking);
    setReviewForm({
      rating: existing?.rating || 5,
      comment: existing?.comment || "",
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal || !currentUser) return;

    setSavingReview(true);
    const toastId = toast.loading("Saving your review...");
    try {
      const res = await axiosInstance.post("/api/users/reviews", {
        restaurantId: reviewModal.restaurantId?._id || reviewModal.restaurantId,
        bookingId: reviewModal._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      const saved = res.data?.data;
      setReviews(prev => {
        const rest = prev.filter(r => String(r.bookingId) !== String(reviewModal._id));
        return saved ? [saved, ...rest] : rest;
      });
      toast.success("Review saved.", { id: toastId });
      setReviewModal(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save review.", { id: toastId });
    } finally {
      setSavingReview(false);
    }
  };

  const TABS = [
    { id: "reservations", label: "Table Bookings", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { id: "orders", label: "Food Orders", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    )},
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-5 md:px-10" style={{ background: "#080C12" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#C8A96A" }}>Your History</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-2">Bookings & Orders</h1>
          <p className="text-text-secondary text-sm">Track your upcoming reservations and past food orders.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 rounded-xl w-fit"
          style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === t.id ? "rgba(44,122,92,0.15)" : "transparent",
                color: activeTab === t.id ? "#2C7A5C" : "#8B9CB5",
                border: activeTab === t.id ? "1px solid rgba(44,122,92,0.25)" : "1px solid transparent",
              }}>
              {t.icon}
              {t.label}
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: activeTab === t.id ? "rgba(44,122,92,0.2)" : "rgba(255,255,255,0.06)", color: activeTab === t.id ? "#2C7A5C" : "#4A5568" }}>
                {t.id === "reservations" ? bookings.length : orders.length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* RESERVATIONS */}
            {activeTab === "reservations" && (
              bookings.length === 0 ? (
                <EmptyState icon="📅" title="No reservations yet" desc="Book a table at your favourite restaurant to get started." action={{ label: "Browse Restaurants", onClick: () => navigate("/restaurants") }} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {bookings.map((b, idx) => {
                    const existingReview = getReviewForBooking(b._id);
                    return (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-[22px] p-6 flex flex-col"
                      style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <span className={`badge ${b.status === "cancelled" ? "badge-red" : ["accepted", "ready", "completed"].includes(b.status) ? "badge-green" : "badge-gold"} mb-2 inline-block`}>
                            {b.status || "pending"}
                          </span>
                          <h3 className="font-serif text-xl font-bold text-white">{b.restaurantId?.name || "Restaurant"}</h3>
                          <p className="text-xs text-text-muted mt-0.5">{b.restaurantId?.location || ""}</p>
                        </div>
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: "rgba(44,122,92,0.1)", border: "1px solid rgba(44,122,92,0.2)" }}>
                          🍽️
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {[["Date", b.date], ["Time", b.time], ["Guests", `${b.guests} pax`]].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#4A5568" }}>{label}</p>
                            <p className="text-sm font-semibold text-white">{val}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="font-mono text-xs" style={{ color: "#4A5568" }}>#{b._id.slice(-6).toUpperCase()}</span>
                        <div className="flex items-center gap-2">
                          {orders.find(o => o.bookingId === b._id) && (
                            <span className="badge badge-gold">Food Attached</span>
                          )}
                          {existingReview ? (
                            <button onClick={() => openReviewModal(b)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold"
                              style={{ background: "rgba(200,169,106,0.12)", border: "1px solid rgba(200,169,106,0.24)", color: "#C8A96A" }}>
                              Rated {existingReview.rating}/5
                            </button>
                          ) : (
                            <button onClick={() => openReviewModal(b)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold"
                              style={{ background: "rgba(44,122,92,0.14)", border: "1px solid rgba(44,122,92,0.28)", color: "#2C7A5C" }}>
                              Add Review
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              )
            )}

            {/* ORDERS */}
            {activeTab === "orders" && (
              orders.length === 0 ? (
                <EmptyState icon="🧾" title="No food orders yet" desc="Pre-order from your next restaurant booking to see receipts here." action={{ label: "Book a Table", onClick: () => navigate("/restaurants") }} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {orders.map((o, idx) => (
                    <motion.div
                      key={o._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-[22px] overflow-hidden flex"
                      style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {/* Receipt body */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-white">{o.restaurantId?.name || "Restaurant"}</h3>
                            <p className="text-xs text-text-muted mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <span className="badge badge-gold">{o.orderType === "direct" ? "Takeout" : "Pre-Order"}</span>
                        </div>

                        <div className="space-y-2.5 mb-5">
                          {o.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold"
                                  style={{ background: "rgba(255,255,255,0.06)", color: "#8B9CB5" }}>{item.quantity}</span>
                                <span className="text-text-secondary">{item.name}</span>
                              </div>
                              <span className="font-medium text-white">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {o.items.length > 3 && (
                            <p className="text-xs italic" style={{ color: "#4A5568" }}>+{o.items.length - 3} more items</p>
                          )}
                        </div>

                        <div className="flex justify-between items-end pt-4" style={{ borderTop: "1px dashed rgba(255,255,255,0.08)" }}>
                          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: "#4A5568" }}>Total</span>
                          <span className="font-serif text-2xl font-bold text-white">₹{o.totalAmount}</span>
                        </div>
                      </div>

                      {/* Stub */}
                      <div className="w-10 flex-shrink-0 flex items-center justify-center relative"
                        style={{ background: "rgba(44,122,92,0.1)", borderLeft: "1px dashed rgba(255,255,255,0.08)" }}>
                        <span className="rotate-90 text-xs font-mono font-bold whitespace-nowrap" style={{ color: "rgba(44,122,92,0.4)", letterSpacing: "0.2em" }}>
                          #{o._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="absolute -left-2.5 w-5 h-5 rounded-full" style={{ background: "#080C12" }} />
                        <div className="absolute -right-2.5 w-5 h-5 rounded-full" style={{ background: "#080C12" }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.72)" }}>
          <motion.form
            onSubmit={submitReview}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-[24px] p-6"
            style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C8A96A" }}>Rate your visit</p>
                <h3 className="font-serif text-2xl font-bold text-white">{reviewModal.restaurantId?.name || "Restaurant"}</h3>
                <p className="text-xs mt-1" style={{ color: "#8B9CB5" }}>{reviewModal.date} at {reviewModal.time}</p>
              </div>
              <button type="button" onClick={() => setReviewModal(null)}
                className="w-9 h-9 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8B9CB5" }}>
                X
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewForm(p => ({ ...p, rating: value }))}
                  className="w-11 h-11 rounded-xl text-lg font-bold transition-all"
                  style={{
                    background: value <= reviewForm.rating ? "rgba(200,169,106,0.18)" : "rgba(255,255,255,0.04)",
                    border: value <= reviewForm.rating ? "1px solid rgba(200,169,106,0.45)" : "1px solid rgba(255,255,255,0.08)",
                    color: value <= reviewForm.rating ? "#C8A96A" : "#4A5568",
                  }}
                  aria-label={`${value} star rating`}
                >
                  ★
                </button>
              ))}
            </div>

            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
              rows={4}
              maxLength={500}
              placeholder="Share what stood out about your experience..."
              className="w-full mt-2 p-4 rounded-2xl text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}
            />
            <p className="text-right text-xs mt-1" style={{ color: "#4A5568" }}>{reviewForm.comment.length}/500</p>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setReviewModal(null)}
                className="px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9CB5" }}>
                Cancel
              </button>
              <button type="submit" disabled={savingReview}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                {savingReview ? "Saving..." : "Save Review"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon, title, desc, action }) => (
  <div className="py-24 text-center rounded-[24px]"
    style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
    <span className="text-5xl block mb-4 opacity-30">{icon}</span>
    <h3 className="font-serif text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-text-secondary mb-6">{desc}</p>
    {action && (
      <button onClick={action.onClick}
        className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
        {action.label}
      </button>
    )}
  </div>
);

export default UserBookings;
