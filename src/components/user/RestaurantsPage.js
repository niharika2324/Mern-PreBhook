import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiUrl, assetUrl } from "../../config/api.js";

const CUISINE_FALLBACKS = {
  indian:    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=700&q=80",
  japanese:  "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=700&q=80",
  italian:   "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=80",
  chinese:   "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700&q=80",
  thai:      "https://images.unsplash.com/photo-1562802378-063ec186a863?w=700&q=80",
  mexican:   "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=700&q=80",
  default:   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=80",
};

const getImg = (r) => {
  // Prefer the owner-uploaded image from backend
  if (r.image) return assetUrl(r.image);
  // Cuisine-based Unsplash fallback
  const c = (r.cuisine || "").toLowerCase();
  const key = Object.keys(CUISINE_FALLBACKS).find(k => c.includes(k));
  return key ? CUISINE_FALLBACKS[key] : CUISINE_FALLBACKS.default;
};

const RestaurantsPage = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");

  useEffect(() => {
    axios.get(apiUrl("/api/users/approved-restaurants"))
      .then(r => setRestaurants(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cuisines = ["All", ...Array.from(new Set(restaurants.map(r => r.cuisine).filter(Boolean)))];

  const filtered = restaurants.filter(r => {
    const matchSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = activeCuisine === "All" || r.cuisine === activeCuisine;
    return matchSearch && matchCuisine;
  });

  return (
    <div className="min-h-screen pt-20" style={{ background: "#080C12" }}>

      {/* ── PAGE HERO ── */}
      <div className="px-5 md:px-10 pt-10 pb-12 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-xs font-bold uppercase tracking-widest block mb-3" style={{ color: "#C8A96A" }}>
            Discover
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-3">
            Our Restaurants
          </h1>
          <p className="text-text-secondary max-w-xl mb-8">
            Choose a restaurant, add your favourite dishes, and book your table — all in one seamless flow.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#4A5568" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, cuisine, or location…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: "#0E1520",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F1F5F9",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(44,122,92,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
        </motion.div>
      </div>

      {/* ── CUISINE FILTER ── */}
      <div className="px-5 md:px-10 max-w-7xl mx-auto mb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {cuisines.map(c => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeCuisine === c ? "#2C7A5C" : "rgba(255,255,255,0.04)",
                color: activeCuisine === c ? "#fff" : "#8B9CB5",
                border: activeCuisine === c ? "1px solid rgba(44,122,92,0.5)" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESTAURANTS GRID ── */}
      <div className="px-5 md:px-10 max-w-7xl mx-auto pb-20">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center rounded-[24px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
            <span className="text-5xl block mb-4 opacity-30">🔍</span>
            <h3 className="font-serif text-xl font-bold text-white mb-2">No restaurants found</h3>
            <p className="text-text-secondary text-sm">Try adjusting your search or filter.</p>
            <button onClick={() => { setSearch(""); setActiveCuisine("All"); }}
              className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#4A5568" }}>
              {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r, i) => (
                <motion.article
                  key={r._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => navigate(`/restaurant/${r._id}`)}
                  className="group relative rounded-[24px] overflow-hidden cursor-pointer"
                  style={{ height: "360px", boxShadow: "0 16px 48px -8px rgba(0,0,0,0.5)" }}
                >
                  {/* Background image */}
                  <img
                    src={getImg(r)}
                    alt={r.name}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
                  />
                  <div className="absolute inset-0" style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 35%, rgba(0,0,0,0.92) 100%)"
                  }} />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                      {r.cuisine || "Multi Cuisine"}
                    </span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-serif"
                      style={{ background: "#C8A96A", color: "#080C12", boxShadow: "0 4px 12px rgba(200,169,106,0.4)" }}>
                      {r.ratingAverage ? r.ratingAverage.toFixed(1) : "New"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h3 className="font-serif text-2xl font-bold text-white mb-1 transform group-hover:translate-y-0 translate-y-1 transition-transform duration-300">
                      {r.name}
                    </h3>
                    <p className="text-white/50 text-sm flex items-center gap-2 mb-4">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {r.location || "Premium Location"}
                    </p>
                    <p className="text-xs font-semibold mb-4" style={{ color: "#C8A96A" }}>
                      ★ {r.ratingAverage ? `${r.ratingAverage.toFixed(1)} rating` : "No ratings yet"}
                      {r.ratingCount > 0 && <span style={{ color: "rgba(255,255,255,0.45)" }}> · {r.ratingCount} reviews</span>}
                    </p>

                    {/* CTA — slides up on hover */}
                    <div className="overflow-hidden max-h-0 group-hover:max-h-12 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                      <button
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px rgba(44,122,92,0.4)" }}
                      >
                        View Menu & Book Table →
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantsPage;
