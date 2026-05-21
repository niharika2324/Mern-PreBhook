import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { apiUrl, assetUrl } from "../../config/api.js";

const UserPreOrder = () => {
  const { bookingId, restaurantId: urlRestaurantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const restaurantId = location.state?.restaurantId || urlRestaurantId || "";
  const isPreOrder = !!bookingId;

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (!restaurantId) { navigate("/user/dashboard"); return; }
    axios.get(apiUrl(`/api/users/menu/${restaurantId}`))
      .then(res => setMenu(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId, navigate]);

  const updateQuantity = (item, delta) => {
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

  const getQuantity = (menuId) => cart.find(i => i.menuId === menuId)?.quantity || 0;

  const totalAmount = useMemo(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    const toastId = toast.loading("Confirming your order...");
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      const payload = { restaurantId, userId: user?._id || user?.id || null, items: cart, totalAmount };
      if (isPreOrder) payload.bookingId = bookingId;
      const res = await axios.post(apiUrl("/api/preorder/add"), payload);
      setOrderData(res.data?.data || payload);
      setSuccess(true);
      toast.success(isPreOrder ? "Pre-order confirmed." : "Order confirmed.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to confirm order. Please try again.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── SUCCESS RECEIPT ── */
  if (success) {
    const tax = totalAmount * 0.05;
    const finalTotal = totalAmount + tax;
    const orderNumber = orderData?._id ? orderData._id.toString().slice(-6).toUpperCase() : Math.floor(Math.random() * 900000 + 100000);
    const dateStr = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: "#080C12" }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="max-w-md w-full"
        >
          <div className="rounded-[28px] overflow-hidden" style={{ background: "#0E1520", border: "1px solid rgba(44,122,92,0.25)", boxShadow: "0 0 60px -10px rgba(44,122,92,0.2)" }}>
            {/* Header stripe */}
            <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 success-pulse"
                style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)" }}>🍽️</div>
              <h2 className="font-serif text-2xl font-bold text-white mb-1">
                {isPreOrder ? "Pre-Order Confirmed!" : "Order Received!"}
              </h2>
              <p className="font-mono text-xs mt-1" style={{ color: "#4A5568" }}>ORDER #{orderNumber}</p>
              <p className="text-xs mt-0.5" style={{ color: "#4A5568" }}>{dateStr}</p>
            </div>

            {/* Items */}
            <div className="px-8 py-5 space-y-3" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#4A5568" }}>
                <span>Item</span><span>Amount</span>
              </div>
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs" style={{ color: "#4A5568" }}>{item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-serif font-bold text-white">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-8 py-4" style={{ borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
              {[["Subtotal", `₹${totalAmount.toFixed(2)}`], ["Tax (5%)", `₹${tax.toFixed(2)}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-1" style={{ color: "#8B9CB5" }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-8 py-5">
              <span className="text-sm font-bold uppercase tracking-widest text-white">Total</span>
              <span className="font-serif text-3xl font-bold" style={{ color: "#C8A96A" }}>₹{finalTotal.toFixed(2)}</span>
            </div>

            {/* Note */}
            <div className="px-8 pb-8">
              <div className="p-4 rounded-xl text-center text-sm font-medium" style={{ color: "#2C7A5C", background: "rgba(44,122,92,0.08)", border: "1px solid rgba(44,122,92,0.15)" }}>
                {isPreOrder ? "Your food will be prepared ahead of your arrival." : "Your order has been received successfully."}
              </div>
              <button onClick={() => navigate("/user/dashboard")}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── MAIN MENU PAGE ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080C12" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between"
        style={{ background: "rgba(8,12,18,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="pt-12">
          <span className="text-xs font-bold uppercase tracking-widest block mb-0.5" style={{ color: "#C8A96A" }}>
            {isPreOrder ? "Pre-Order Menu" : "Signature Menu"}
          </span>
          <h1 className="font-serif text-2xl font-bold text-white">Choose Your Dishes</h1>
        </div>
        <button onClick={() => navigate("/user/dashboard")}
          className="text-xs font-semibold uppercase tracking-wider transition-colors pt-12"
          style={{ color: "#4A5568" }}
          onMouseEnter={e => e.currentTarget.style.color = "#F1F5F9"}
          onMouseLeave={e => e.currentTarget.style.color = "#4A5568"}>
          {isPreOrder ? "Skip →" : "Back →"}
        </button>
      </div>

      {/* Content split */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-5 md:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* ── Menu items ── */}
        <div className="flex-1 w-full">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="w-10 h-10 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
            </div>
          ) : menu.length === 0 ? (
            <div className="py-20 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              <span className="text-4xl block mb-3 opacity-30">🍽️</span>
              <p className="text-text-secondary font-serif text-lg">Menu unavailable at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32 lg:pb-8">
              {menu.map((item, idx) => {
                const qty = getQuantity(item._id);
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
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
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
                        <h3 className="font-bold text-white text-sm leading-tight mb-1">{item.name}</h3>
                        <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "#4A5568" }}>{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-serif font-bold text-lg" style={{ color: "#C8A96A" }}>₹{item.price}</span>
                        {qty === 0 ? (
                          <button onClick={() => updateQuantity(item, 1)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#2C7A5C"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(44,122,92,0.15)"; e.currentTarget.style.color = "#2C7A5C"; }}>
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center rounded-xl overflow-hidden"
                            style={{ background: "#2C7A5C" }}>
                            <button onClick={() => updateQuantity(item, -1)} className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-black/20 transition-colors">−</button>
                            <span className="w-7 text-center text-white font-bold text-sm">{qty}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="w-8 h-8 flex items-center justify-center text-white font-bold text-lg hover:bg-black/20 transition-colors">+</button>
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

        {/* ── Desktop cart sidebar ── */}
        <aside className="w-full lg:w-[360px] flex-shrink-0 sticky top-32 hidden lg:block">
          <div className="rounded-[24px] p-6 flex flex-col" style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between pb-5 mb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-serif text-xl font-bold text-white">Your Order</h3>
              <span className="badge badge-green">{cart.reduce((a, b) => a + b.quantity, 0)} items</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 min-h-[160px] max-h-[50vh]" style={{ scrollbarWidth: "none" }}>
              {cart.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2 opacity-40">
                  <span className="text-3xl">🛒</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menuId} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs" style={{ color: "#C8A96A" }}>₹{item.price}</p>
                    </div>
                    <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <button onClick={() => updateQuantity({ _id: item.menuId }, -1)} className="w-7 h-7 flex items-center justify-center font-bold text-lg transition-colors text-white hover:bg-white/10">−</button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity({ _id: item.menuId }, 1)} className="w-7 h-7 flex items-center justify-center font-bold text-lg transition-colors text-white hover:bg-white/10">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-5 mt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-white">Total</span>
                <span className="font-serif text-2xl font-bold" style={{ color: "#C8A96A" }}>₹{totalAmount.toFixed(2)}</span>
              </div>
              <button onClick={handleConfirmOrder} disabled={cart.length === 0 || submitting}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.4)" }}>
                {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order…</> : "Confirm Order"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile floating cart bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
            <div className="rounded-2xl flex items-center justify-between p-4"
              style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px -5px rgba(0,0,0,0.6)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#2C7A5C" }}>
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </p>
                <p className="font-serif font-bold text-xl" style={{ color: "#C8A96A" }}>₹{totalAmount}</p>
              </div>
              <button onClick={handleConfirmOrder} disabled={submitting}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                {submitting ? "…" : "Checkout"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserPreOrder;
