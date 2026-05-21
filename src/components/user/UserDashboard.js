import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiUrl, assetUrl } from "../../config/api.js";

import heroSlide1 from "../../assets/images/herro-slide-1.jpg";
import heroSlide2 from "../../assets/images/background.jpg";

const heroImages = [heroSlide1, heroSlide2];

const placeholderRestaurants = [
  { id: "p1", name: "The Spice Hub",   cuisine: "Indian",    rating: 4.5, location: "Connaught Place, Delhi" },
  { id: "p2", name: "Sushi World",     cuisine: "Japanese",  rating: 4.8, location: "Bandra West, Mumbai" },
  { id: "p3", name: "Pizza Palace",   cuisine: "Italian",   rating: 4.7, location: "Koramangala, Bengaluru" },
];

const CUISINE_IMAGES = {
  indian:    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
  japanese:  "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&q=80",
  italian:   "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
  default:   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
};

const getRestaurantImage = (r) => {
  if (r.image) return assetUrl(r.image);
  const c = (r.cuisine || "").toLowerCase();
  return CUISINE_IMAGES[c] || CUISINE_IMAGES.default;
};

const OFFERS = [
  { id: 1, icon: "⚡", title: "Instant Table Booking", desc: "Reserve premium tables in seconds with real-time confirmation.", badge: "Priority", color: "#2C7A5C", action: "booking" },
  { id: 2, icon: "👨‍🍳", title: "Chef's Specials",       desc: "Explore handpicked signature dishes from top-rated kitchens.", badge: "Featured", color: "#C8A96A", action: "menu",    featured: true },
  { id: 3, icon: "🚀", title: "Pre-Order Lane",         desc: "Order before you arrive and have your meal ready on arrival.", badge: "Fast",     color: "#60A5FA", action: "menu" },
  { id: 4, icon: "🎁", title: "Member Deals",           desc: "Unlock seasonal offers and limited-time dining advantages.",   badge: "Limited",  color: "#F472B6", action: "booking" },
];

const TESTIMONIALS = [
  { quote: "An unparalleled dining experience. The attention to detail from the staff and the taste of the food was breathtaking.", name: "Eleanor M.", avatar: "E" },
  { quote: "Booking was seamless. We arrived to a perfectly set table. The pre-order feature saved us so much time.", name: "Julian W.", avatar: "J" },
  { quote: "The atmosphere is sophisticated yet welcoming. Will definitely be returning soon.", name: "Sarah C.", avatar: "S" },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 7000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    axios.get(apiUrl("/api/users/approved-restaurants"))
      .then(res => setRestaurants(res.data?.data || []))
      .catch(() => {});
  }, []);

  const list = restaurants.length > 0 ? restaurants : placeholderRestaurants;

  const handleViewRestaurant = (r) => {
    const id = r._id || r.id;
    if (id && typeof id === "string" && id.length > 5) {
      navigate(`/restaurant/${id}`);
    } else {
      navigate("/restaurants");
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ background: "#080C12" }}>

      {/* ── HERO ── */}
      <section className="relative w-full h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        {heroImages.map((img, idx) => (
          <motion.img
            key={idx}
            src={img}
            alt="Luxury dining"
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: heroIdx === idx ? 1 : 0, scale: heroIdx === idx ? 1.05 : 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10" style={{
          background: "linear-gradient(to bottom, rgba(8,12,18,0.5) 0%, rgba(8,12,18,0.3) 40%, rgba(8,12,18,0.85) 100%)"
        }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 z-10" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        <div className="relative z-20 text-center max-w-5xl mx-auto px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(200,169,106,0.12)", border: "1px solid rgba(200,169,106,0.25)", color: "#C8A96A" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            An Elevated Culinary Journey
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-none mb-6"
          >
            Reserve. Dine.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #C8A96A 0%, #E8C97A 50%, #C8A96A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Enjoy.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg md:text-xl text-white/60 font-light max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Discover exceptional restaurants, book premium tables instantly, and pre-order your favourite curated meals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => navigate("/restaurants")}
              className="px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 8px 32px -4px rgba(44,122,92,0.5)" }}
            >
              Explore Restaurants
            </button>
            <button
              onClick={() => navigate("/user/bookings")}
              className="px-8 py-4 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
            >
              My Bookings
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-40">
          <div className="w-0.5 h-8 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs uppercase tracking-widest">Scroll</span>
        </div>
      </section>

      {/* ── RESTAURANTS ── */}
      <section className="py-24 px-5 md:px-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#C8A96A" }}>
              The Collection
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">Curated Dining Experiences</h2>
          </div>
          <p className="text-text-secondary max-w-sm text-sm leading-relaxed">
            Handpicked restaurants tailored for those who demand the finest culinary experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {list.map((r, i) => (
            <motion.article
              key={r._id || r.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative h-[480px] rounded-[28px] overflow-hidden cursor-pointer"
              style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.6)" }}
            >
              <img
                src={getRestaurantImage(r)}
                alt={r.name}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
              />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.95) 100%)"
              }} />

              {/* Top badges */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                  {r.cuisine || "Multi Cuisine"}
                </span>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-app font-serif"
                  style={{ background: "#C8A96A", boxShadow: "0 4px 12px rgba(200,169,106,0.5)" }}>
                  {r.rating || "4.5"}
                </div>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-7 z-10">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-1">{r.name}</h3>
                  <p className="text-white/50 text-sm flex items-center gap-2 mb-5">
                    <span className="w-4 h-px inline-block" style={{ background: "#C8A96A" }} />
                    {r.location || "Premium Location"}
                  </p>
                </div>

                {/* CTA — slide up on hover */}
                <div className="overflow-hidden max-h-0 group-hover:max-h-16 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewRestaurant(r); }}
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-app transition-all"
                    style={{ background: "#C8A96A" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#D9BA7A"}
                    onMouseLeave={e => e.currentTarget.style.background = "#C8A96A"}
                  >
                    View Menu & Book Table →
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── OFFERS ── */}
      <section className="py-24 w-full" style={{ background: "#0A0D14" }}>
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#C8A96A" }}>Member Benefits</span>
            <h2 className="font-serif text-4xl font-bold text-white">Elevated Dining Advantages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {OFFERS.map((o, idx) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex flex-col p-6 rounded-[22px] group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: o.featured ? "rgba(44,122,92,0.12)" : "#0E1520",
                  border: o.featured ? "1px solid rgba(44,122,92,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: o.featured ? "0 0 40px -8px rgba(44,122,92,0.2)" : "none"
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5"
                  style={{ background: `${o.color}18`, border: `1px solid ${o.color}30` }}>
                  {o.icon}
                </div>
                <span className="self-start px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: `${o.color}15`, color: o.color }}>
                  {o.badge}
                </span>
                <h3 className="font-serif text-lg font-bold text-white mb-2">{o.title}</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed flex-1">{o.desc}</p>
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: o.featured ? "#2C7A5C" : "rgba(255,255,255,0.05)",
                    color: o.featured ? "#fff" : "#8B9CB5",
                    border: o.featured ? "none" : "1px solid rgba(255,255,255,0.08)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = o.featured ? "#3A9970" : "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = o.featured ? "#2C7A5C" : "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = o.featured ? "#fff" : "#8B9CB5";
                  }}
                  onClick={() => navigate("/restaurants")}
                >
                  Explore
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-5 md:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#C8A96A" }}>Guest Stories</span>
          <h2 className="font-serif text-4xl font-bold text-white">What Our Diners Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-7 rounded-[22px] flex flex-col gap-5"
              style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4" fill="#C8A96A" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #C8A96A)" }}>
                  {t.avatar}
                </div>
                <span className="text-sm font-semibold text-white">{t.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-[32px] overflow-hidden relative text-center p-14"
          style={{
            background: "linear-gradient(135deg, #0E1520 0%, #131B27 100%)",
            border: "1px solid rgba(200,169,106,0.15)",
            boxShadow: "0 0 60px -20px rgba(200,169,106,0.2)"
          }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,169,106,0.15) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest mb-4 block" style={{ color: "#C8A96A" }}>
              Start Your Journey
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Dine?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto leading-relaxed">
              Book your table in under 60 seconds and experience a whole new level of dining.
            </p>
            <button
              onClick={() => navigate("/restaurants")}
              className="px-10 py-4 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 8px 32px -4px rgba(44,122,92,0.5)" }}
            >
              Reserve Your Table
            </button>
          </div>
        </motion.div>
      </section>

    </div>
  );
};

export default UserDashboard;
