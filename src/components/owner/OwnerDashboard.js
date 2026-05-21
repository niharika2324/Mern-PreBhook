import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.js";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { assetUrl } from "../../config/api.js";

/* ── Sidebar tabs ── */
const TABS = [
  { id: "overview",     label: "Overview",      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { id: "menu",         label: "Menu",          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { id: "tables",       label: "Tables",        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
  { id: "reservations", label: "Reservations",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];

const EMPTY_RESTAURANT_FORM = { name: "", location: "", cuisine: "", maxCapacity: "40" };
const EMPTY_MENU_FORM        = { name: "", price: "", category: "appetizer", description: "" };
const EMPTY_TABLE_FORM       = { number: "", capacity: "", location: "indoor" };

const BOOKING_ACTIONS = {
  pending: [
    { label: "Accept", status: "accepted", tone: "green" },
    { label: "Cancel", status: "cancelled", tone: "red" },
  ],
  accepted: [
    { label: "Start Preparation", status: "preparing", tone: "gold" },
    { label: "Cancel", status: "cancelled", tone: "red" },
  ],
  preparing: [
    { label: "Mark Ready", status: "ready", tone: "green" },
    { label: "Cancel", status: "cancelled", tone: "red" },
  ],
  ready: [
    { label: "Complete", status: "completed", tone: "green" },
  ],
};

const statusBadgeClass = (status) => {
  if (["accepted", "ready", "completed"].includes(status)) return "badge-green";
  if (status === "cancelled") return "badge-red";
  return "badge-gold";
};

const actionStyle = (tone) => {
  if (tone === "red") {
    return { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#F87171" };
  }
  if (tone === "gold") {
    return { background: "rgba(200,169,106,0.12)", border: "1px solid rgba(200,169,106,0.28)", color: "#C8A96A" };
  }
  return { background: "rgba(44,122,92,0.14)", border: "1px solid rgba(44,122,92,0.28)", color: "#2C7A5C" };
};

/* ── Small helper: field label ── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>{label}</label>
    {children}
  </div>
);

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [restaurants, setRestaurants]         = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menu, setMenu]         = useState([]);
  const [tables, setTables]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [preOrders, setPreOrders]       = useState([]);
  const [activeTab, setActiveTab]       = useState("overview");

  /* modals / forms */
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);  // restaurant object being edited
  const [showAddMenu,  setShowAddMenu]   = useState(false);
  const [editingMenu,  setEditingMenu]   = useState(null);            // menu item being edited
  const [showAddTable, setShowAddTable]  = useState(false);

  /* form state */
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT_FORM);
  const [restaurantImage, setRestaurantImage] = useState(null);
  const [menuForm, setMenuForm]   = useState(EMPTY_MENU_FORM);
  const [menuImage, setMenuImage] = useState(null);
  const [tableForm, setTableForm] = useState(EMPTY_TABLE_FORM);

  /* loading states */
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const restaurantImgRef = useRef(null);
  const menuImgRef = useRef(null);

  const fetchRestaurants = useCallback(async (ownerId) => {
    try {
      const res = await axiosInstance.get(`/api/users/restaurants/owner/${ownerId}`);
      const list = res.data?.data || [];
      setRestaurants(list);
      setSelectedRestaurant(current => current || list[0] || null);
    } catch (e) { console.error(e); }
  }, []);

  /* ── Bootstrap ── */
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (!user || user.role !== "owner") { navigate("/"); return; }
      setCurrentUser(user);
      fetchRestaurants(user._id);
    } catch { navigate("/"); }
  }, [navigate, fetchRestaurants]);

  /* Fetch menu when restaurant changes */
  useEffect(() => {
    if (!selectedRestaurant?._id) return;
    axiosInstance.get(`/api/users/menu/${selectedRestaurant._id}`)
      .then(r => setMenu(r.data?.data || []))
      .catch(console.error);
    axiosInstance.get(`/api/users/tables/${selectedRestaurant._id}`)
      .then(r => setTables(r.data?.data || []))
      .catch(() => setTables([]));
  }, [selectedRestaurant]);

  /* Fetch reservations on tab switch */
  useEffect(() => {
    if (!selectedRestaurant?._id || activeTab !== "reservations") return;
    setReservationsLoading(true);
    Promise.all([
      axiosInstance.get(`/api/users/bookings/${selectedRestaurant._id}`),
      axiosInstance.get(`/api/preorder/restaurant/${selectedRestaurant._id}`)
    ]).then(([rRes, pRes]) => {
      setReservations(rRes.data?.data || []);
      setPreOrders(pRes.data?.data || []);
    }).catch(console.error)
      .finally(() => setReservationsLoading(false));
  }, [selectedRestaurant, activeTab]);

  const handleLogout = () => { localStorage.removeItem("currentUser"); navigate("/"); };

  const updateReservationStatus = async (bookingId, status) => {
    setUpdatingBookingId(bookingId);
    const toastId = toast.loading("Updating booking...");
    try {
      const res = await axiosInstance.patch(`/api/users/bookings/${bookingId}/status`, { status });
      const updated = res.data?.data;
      setReservations(prev => prev.map(item => item._id === bookingId ? { ...item, ...updated } : item));
      toast.success("Booking updated.", { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update booking.", { id: toastId });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  /* ────────────────────────────────────────────────────────────
     RESTAURANT CRUD
  ──────────────────────────────────────────────────────────── */
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!restaurantForm.name || !restaurantForm.location || !restaurantForm.cuisine) return toast.error("Please fill all required fields.");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(restaurantForm).forEach(([k, v]) => fd.append(k, v));
      fd.append("ownerId", currentUser._id);
      if (restaurantImage) fd.append("image", restaurantImage);

      const res = await toast.promise(
        axiosInstance.post("/api/users/add-restaurant", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
        {
          loading: "Adding restaurant...",
          success: "Restaurant added.",
          error: (e) => e.response?.data?.message || "Error adding restaurant.",
        }
      );
      const newR = res.data?.data || { ...restaurantForm };
      setRestaurants(p => [...p, newR]);
      setSelectedRestaurant(newR);
      setRestaurantForm(EMPTY_RESTAURANT_FORM);
      setRestaurantImage(null);
      if (restaurantImgRef.current) restaurantImgRef.current.value = "";
      setShowAddRestaurant(false);
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(restaurantForm).forEach(([k, v]) => fd.append(k, v));
      if (restaurantImage) fd.append("image", restaurantImage);

      const res = await toast.promise(
        axiosInstance.put(`/api/users/update-restaurant/${editingRestaurant._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
        {
          loading: "Saving restaurant...",
          success: "Restaurant updated.",
          error: (e) => e.response?.data?.message || "Error updating restaurant.",
        }
      );
      const updated = res.data?.data;
      setRestaurants(p => p.map(r => r._id === editingRestaurant._id ? updated : r));
      if (selectedRestaurant?._id === editingRestaurant._id) setSelectedRestaurant(updated);
      setEditingRestaurant(null);
      setRestaurantForm(EMPTY_RESTAURANT_FORM);
      setRestaurantImage(null);
      if (restaurantImgRef.current) restaurantImgRef.current.value = "";
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleDeleteRestaurant = async (r) => {
    if (!window.confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    try {
      await toast.promise(
        axiosInstance.delete(`/api/users/delete-restaurant/${r._id}`),
        {
          loading: "Deleting restaurant...",
          success: "Restaurant deleted.",
          error: "Error deleting restaurant.",
        }
      );
      const remaining = restaurants.filter(x => x._id !== r._id);
      setRestaurants(remaining);
      if (selectedRestaurant?._id === r._id) setSelectedRestaurant(remaining[0] || null);
    } catch (e) {}
  };

  const openEditRestaurant = (r) => {
    setEditingRestaurant(r);
    setRestaurantForm({ name: r.name || "", location: r.location || "", cuisine: r.cuisine || "", maxCapacity: String(r.maxCapacity || 40) });
    setRestaurantImage(null);
    setShowAddRestaurant(false);
  };

  /* ────────────────────────────────────────────────────────────
     MENU CRUD
  ──────────────────────────────────────────────────────────── */
  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.price) return toast.error("Fill required fields.");
    if (!selectedRestaurant?._id) return toast.error("Select a restaurant first.");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(menuForm).forEach(([k, v]) => fd.append(k, v));
      fd.append("restaurantId", selectedRestaurant._id);
      if (menuImage) fd.append("image", menuImage);

      await toast.promise(
        axiosInstance.post("/api/users/add-menu", fd, { headers: { "Content-Type": "multipart/form-data" } }),
        {
          loading: "Publishing dish...",
          success: "Menu item added.",
          error: "Error adding menu item.",
        }
      );
      const res = await axiosInstance.get(`/api/users/menu/${selectedRestaurant._id}`);
      setMenu(res.data?.data || []);
      setMenuForm(EMPTY_MENU_FORM);
      setMenuImage(null);
      if (menuImgRef.current) menuImgRef.current.value = "";
      setShowAddMenu(false);
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    if (!editingMenu) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(menuForm).forEach(([k, v]) => fd.append(k, v));
      if (menuImage) fd.append("image", menuImage);

      const res = await toast.promise(
        axiosInstance.put(`/api/users/update-menu/${editingMenu._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
        {
          loading: "Saving dish...",
          success: "Menu item updated.",
          error: "Error updating menu item.",
        }
      );
      setMenu(p => p.map(m => m._id === editingMenu._id ? res.data.data : m));
      setEditingMenu(null);
      setMenuForm(EMPTY_MENU_FORM);
      setMenuImage(null);
      if (menuImgRef.current) menuImgRef.current.value = "";
    } catch (e) {}
    finally { setSaving(false); }
  };

  const handleDeleteMenu = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from the menu?`)) return;
    try {
      await toast.promise(
        axiosInstance.delete(`/api/users/delete-menu/${item._id}`),
        {
          loading: "Deleting dish...",
          success: "Menu item deleted.",
          error: "Error deleting menu item.",
        }
      );
      setMenu(p => p.filter(m => m._id !== item._id));
    } catch (e) {}
  };

  const openEditMenu = (item) => {
    setEditingMenu(item);
    setMenuForm({ name: item.name || "", price: String(item.price || ""), category: item.category || "appetizer", description: item.description || "" });
    setMenuImage(null);
    setShowAddMenu(false);
    if (menuImgRef.current) menuImgRef.current.value = "";
  };

  /* ────────────────────────────────────────────────────────────
     TABLE CRUD
  ──────────────────────────────────────────────────────────── */
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableForm.number || !tableForm.capacity) return toast.error("Fill required fields.");
    if (!selectedRestaurant?._id) return toast.error("Select a restaurant first.");
    try {
      const res = await toast.promise(
        axiosInstance.post("/api/users/add-table", {
          restaurantId: selectedRestaurant._id,
          number: parseInt(tableForm.number),
          capacity: parseInt(tableForm.capacity),
          location: tableForm.location
        }),
        {
          loading: "Adding table...",
          success: "Table added.",
          error: "Error adding table.",
        }
      );
      setTables(p => [...p, res.data.data]);
      setTableForm(EMPTY_TABLE_FORM);
      setShowAddTable(false);
    } catch (e) {}
  };

  /* ── Loading guard ── */
  if (!currentUser) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#080C12" }}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: "Restaurants", value: restaurants.length,   color: "#C8A96A" },
    { label: "Menu Items",  value: menu.length,           color: "#2C7A5C" },
    { label: "Tables",      value: tables.length,         color: "#60A5FA" },
    { label: "Reservations",value: reservations.length,   color: "#F472B6" },
  ];

  /* ── Shared form panel style ── */
  const formPanel = { background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "24px", padding: "28px" };

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#080C12" }}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className="w-60 hidden md:flex flex-col sticky top-[72px] flex-shrink-0"
        style={{ background: "#0A0D14", borderRight: "1px solid rgba(255,255,255,0.05)", height: "calc(100vh - 72px)" }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>PB</div>
          <div>
            <p className="font-serif font-bold text-white text-sm leading-none">PreBhookh</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#C8A96A" }}>Owner Portal</p>
          </div>
        </div>

        {/* Restaurant switcher */}
        {restaurants.length > 0 && (
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#4A5568" }}>Active Restaurant</p>
            <select
              value={selectedRestaurant?._id || ""}
              onChange={e => setSelectedRestaurant(restaurants.find(r => r._id === e.target.value) || null)}
              className="w-full text-sm py-2 px-3 rounded-xl font-medium outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}
            >
              {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`nav-item w-full ${activeTab === t.id ? "active" : ""}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: "#4A5568" }}>{currentUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "#EF4444" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="flex-1 p-5 md:p-8 pt-24 min-w-0 overflow-y-auto">

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
              style={{
                background: activeTab === t.id ? "rgba(44,122,92,0.15)" : "#0E1520",
                color: activeTab === t.id ? "#2C7A5C" : "#8B9CB5",
                border: activeTab === t.id ? "1px solid rgba(44,122,92,0.25)" : "1px solid rgba(255,255,255,0.06)"
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════ */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-white">Overview</h1>
                <p className="text-text-secondary text-sm mt-1">Welcome back, {currentUser.name?.split(" ")[0]}!</p>
              </div>
              <button onClick={() => { setShowAddRestaurant(true); setEditingRestaurant(null); setRestaurantForm(EMPTY_RESTAURANT_FORM); setRestaurantImage(null); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px -4px rgba(44,122,92,0.4)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add Restaurant
              </button>
            </div>

            {/* Add / Edit Restaurant Form */}
            <AnimatePresence>
              {(showAddRestaurant || editingRestaurant) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={formPanel}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-white">
                      {editingRestaurant ? `Edit — ${editingRestaurant.name}` : "Add New Restaurant"}
                    </h2>
                    <button onClick={() => { setShowAddRestaurant(false); setEditingRestaurant(null); setRestaurantForm(EMPTY_RESTAURANT_FORM); }}
                      className="text-text-muted hover:text-white text-sm transition-colors">✕ Close</button>
                  </div>

                  <form onSubmit={editingRestaurant ? handleUpdateRestaurant : handleAddRestaurant} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Restaurant Name *">
                        <input type="text" value={restaurantForm.name} onChange={e => setRestaurantForm(p=>({...p,name:e.target.value}))} className="input-dark" required placeholder="e.g. The Golden Fork" />
                      </Field>
                      <Field label="Location *">
                        <input type="text" value={restaurantForm.location} onChange={e => setRestaurantForm(p=>({...p,location:e.target.value}))} className="input-dark" required placeholder="e.g. Bandra, Mumbai" />
                      </Field>
                      <Field label="Cuisine Type *">
                        <input type="text" value={restaurantForm.cuisine} onChange={e => setRestaurantForm(p=>({...p,cuisine:e.target.value}))} className="input-dark" required placeholder="e.g. Italian, Indian" />
                      </Field>
                      <Field label="Max Capacity (guests)">
                        <input type="number" value={restaurantForm.maxCapacity} onChange={e => setRestaurantForm(p=>({...p,maxCapacity:e.target.value}))} className="input-dark" placeholder="40" />
                      </Field>
                    </div>

                    {/* Restaurant image upload */}
                    <Field label="Restaurant Cover Image">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all flex-1"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(44,122,92,0.4)"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}>
                          <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#C8A96A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm" style={{ color: restaurantImage ? "#2C7A5C" : "#8B9CB5" }}>
                            {restaurantImage ? restaurantImage.name : (editingRestaurant?.image ? "Click to replace image" : "Upload cover photo")}
                          </span>
                          <input type="file" accept="image/*" ref={restaurantImgRef} onChange={e => setRestaurantImage(e.target.files[0] || null)} className="hidden" />
                        </label>
                        {/* Preview */}
                        {(restaurantImage || editingRestaurant?.image) && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                            style={{ border: "1px solid rgba(44,122,92,0.3)" }}>
                            <img
                              src={restaurantImage ? URL.createObjectURL(restaurantImage) : assetUrl(editingRestaurant.image)}
                              alt="preview" className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#4A5568" }}>JPG, PNG, WEBP — shown on the restaurants page. Recommended: 16:9, min 800px wide.</p>
                    </Field>

                    <div className="flex gap-3 pt-1">
                      <button type="submit" disabled={saving}
                        className="px-7 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px -4px rgba(44,122,92,0.4)" }}>
                        {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{editingRestaurant ? "Saving…" : "Adding…"}</> : (editingRestaurant ? "Save Changes" : "Add Restaurant")}
                      </button>
                      <button type="button" onClick={() => { setShowAddRestaurant(false); setEditingRestaurant(null); setRestaurantForm(EMPTY_RESTAURANT_FORM); }}
                        className="px-7 py-3 rounded-xl text-sm font-semibold text-text-secondary"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats row */}
            {restaurants.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="w-2 h-6 rounded-full mb-3" style={{ background: s.color }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#4A5568" }}>{s.label}</p>
                    <p className="font-serif text-3xl font-bold text-white mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Restaurant cards */}
            {restaurants.length === 0 ? (
              <div className="py-20 text-center rounded-[24px]"
                style={{ border: "1px dashed rgba(44,122,92,0.3)", background: "rgba(44,122,92,0.03)" }}>
                <span className="text-5xl block mb-4">🏪</span>
                <h3 className="font-serif text-xl font-bold text-white mb-2">No restaurants yet</h3>
                <p className="text-text-secondary text-sm mb-5">Add your first restaurant to start managing menus, tables and reservations.</p>
                <button onClick={() => { setShowAddRestaurant(true); setEditingRestaurant(null); setRestaurantForm(EMPTY_RESTAURANT_FORM); }}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                  + Add Your First Restaurant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {restaurants.map(r => (
                  <div key={r._id}
                    className={`rounded-[22px] overflow-hidden cursor-pointer transition-all ${selectedRestaurant?._id === r._id ? "ring-2 ring-brand" : ""}`}
                    style={{ background: "#0E1520", border: selectedRestaurant?._id === r._id ? "1px solid rgba(44,122,92,0.4)" : "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setSelectedRestaurant(r)}>

                    {/* Image */}
                    <div className="relative h-36 overflow-hidden">
                      {r.image ? (
                        <img src={assetUrl(r.image)} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: "rgba(44,122,92,0.08)" }}>🍽️</div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(14,21,32,0.9) 100%)" }} />
                      {/* Approval badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`badge ${r.isApproved ? "badge-green" : "badge-amber"}`}>
                          {r.isApproved ? "Live" : "Pending Approval"}
                        </span>
                      </div>
                      {/* Selected indicator */}
                      {selectedRestaurant?._id === r._id && (
                        <div className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#2C7A5C" }}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-white text-lg leading-tight">{r.name}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">{r.location}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {r.cuisine && <span className="badge badge-blue capitalize">{r.cuisine}</span>}
                        <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "#4A5568" }}>{r.maxCapacity || 40} capacity</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <button onClick={(e) => { e.stopPropagation(); openEditRestaurant(r); }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B9CB5" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#F1F5F9"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#8B9CB5"; }}>
                          Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedRestaurant(r); setActiveTab("menu"); }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: "rgba(44,122,92,0.12)", border: "1px solid rgba(44,122,92,0.25)", color: "#2C7A5C" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#2C7A5C"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(44,122,92,0.12)"; e.currentTarget.style.color = "#2C7A5C"; }}>
                          Manage Menu
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRestaurant(r); }}
                          className="py-2 px-3 rounded-xl text-xs font-bold transition-all"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ MENU TAB ══════════════════════════════════════ */}
        {activeTab === "menu" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-white">Menu Management</h1>
                <p className="text-text-secondary text-sm mt-1">
                  {selectedRestaurant ? `Managing menu for ${selectedRestaurant.name}` : "Select a restaurant first"}
                </p>
              </div>
              {selectedRestaurant && !showAddMenu && !editingMenu && (
                <button onClick={() => { setShowAddMenu(true); setEditingMenu(null); setMenuForm(EMPTY_MENU_FORM); setMenuImage(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                  style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#2C7A5C"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(44,122,92,0.15)"; e.currentTarget.style.color = "#2C7A5C"; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Add Dish
                </button>
              )}
            </div>

            {/* No restaurant selected */}
            {!selectedRestaurant && (
              <div className="py-16 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-text-secondary text-sm">Please select or add a restaurant from the Overview tab first.</p>
                <button onClick={() => setActiveTab("overview")} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>Go to Overview</button>
              </div>
            )}

            {/* Add / Edit Menu Form */}
            <AnimatePresence>
              {selectedRestaurant && (showAddMenu || editingMenu) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={formPanel}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-white">
                      {editingMenu ? `Edit — ${editingMenu.name}` : "Add New Dish"}
                    </h2>
                    <button onClick={() => { setShowAddMenu(false); setEditingMenu(null); setMenuForm(EMPTY_MENU_FORM); setMenuImage(null); }}
                      className="text-text-muted hover:text-white text-sm transition-colors">✕ Close</button>
                  </div>
                  <form onSubmit={editingMenu ? handleUpdateMenu : handleAddMenu} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Dish Name *">
                        <input type="text" value={menuForm.name} onChange={e => setMenuForm(p=>({...p,name:e.target.value}))} className="input-dark" required placeholder="e.g. Butter Chicken" />
                      </Field>
                      <Field label="Price (₹) *">
                        <input type="number" value={menuForm.price} onChange={e => setMenuForm(p=>({...p,price:e.target.value}))} className="input-dark" required placeholder="250" min="0" />
                      </Field>
                      <Field label="Category">
                        <select value={menuForm.category} onChange={e => setMenuForm(p=>({...p,category:e.target.value}))} className="select-dark">
                          <option value="appetizer">Appetizer</option>
                          <option value="main">Main Course</option>
                          <option value="dessert">Dessert</option>
                          <option value="beverage">Beverage</option>
                        </select>
                      </Field>
                      <Field label="Dish Photo">
                        <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(44,122,92,0.4)"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}>
                          <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#C8A96A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm truncate" style={{ color: menuImage ? "#2C7A5C" : "#8B9CB5" }}>
                            {menuImage ? menuImage.name : (editingMenu?.image ? "Replace photo" : "Upload dish photo")}
                          </span>
                          <input type="file" accept="image/*" ref={menuImgRef} onChange={e => setMenuImage(e.target.files[0] || null)} className="hidden" />
                        </label>
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea value={menuForm.description} onChange={e => setMenuForm(p=>({...p,description:e.target.value}))} rows="3"
                        className="input-dark resize-none" placeholder="Briefly describe the dish, ingredients, etc." />
                    </Field>
                    <div className="flex gap-3 pt-1">
                      <button type="submit" disabled={saving}
                        className="px-7 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px -4px rgba(44,122,92,0.4)" }}>
                        {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{editingMenu ? "Saving…" : "Adding…"}</> : (editingMenu ? "Save Changes" : "Publish Dish")}
                      </button>
                      <button type="button" onClick={() => { setShowAddMenu(false); setEditingMenu(null); setMenuForm(EMPTY_MENU_FORM); setMenuImage(null); }}
                        className="px-7 py-3 rounded-xl text-sm font-semibold text-text-secondary"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menu items grid */}
            {selectedRestaurant && (
              menu.length === 0 ? (
                <div className="py-16 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                  <span className="text-4xl block mb-3 opacity-30">🍽️</span>
                  <p className="text-text-secondary text-sm">No dishes yet. Add your first dish above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {menu.map(item => (
                    <motion.div key={item._id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[20px] p-4 flex gap-4 transition-all"
                      style={{
                        background: editingMenu?._id === item._id ? "rgba(44,122,92,0.08)" : "#0E1520",
                        border: editingMenu?._id === item._id ? "1px solid rgba(44,122,92,0.3)" : "1px solid rgba(255,255,255,0.07)"
                      }}>
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                        {item.image
                          ? <img src={assetUrl(item.image)} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=60"; }} />
                          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍲</div>
                        }
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-serif font-bold text-white truncate">{item.name}</h4>
                          <span className="font-semibold text-sm flex-shrink-0" style={{ color: "#C8A96A" }}>₹{item.price}</span>
                        </div>
                        <span className="badge badge-blue capitalize mb-1.5 inline-block" style={{ fontSize: "10px" }}>{item.category}</span>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-2 pl-3 flex-shrink-0 justify-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                        <button onClick={() => openEditMenu(item)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#8B9CB5" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#F1F5F9"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#8B9CB5"; }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteMenu(item)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        )}

        {/* ══ TABLES TAB ════════════════════════════════════ */}
        {activeTab === "tables" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-serif text-3xl font-bold text-white">Table Configuration</h1>
                <p className="text-text-secondary text-sm mt-1">{selectedRestaurant ? `Tables for ${selectedRestaurant.name}` : "Select a restaurant first"}</p>
              </div>
              {selectedRestaurant && !showAddTable && (
                <button onClick={() => setShowAddTable(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "rgba(44,122,92,0.15)", border: "1px solid rgba(44,122,92,0.3)", color: "#2C7A5C" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#2C7A5C"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(44,122,92,0.15)"; e.currentTarget.style.color = "#2C7A5C"; }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Add Table
                </button>
              )}
            </div>

            <AnimatePresence>
              {showAddTable && selectedRestaurant && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={formPanel}>
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-white">Register New Table</h2>
                    <button onClick={() => setShowAddTable(false)} className="text-text-muted hover:text-white text-sm">✕</button>
                  </div>
                  <form onSubmit={handleAddTable} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Table Number *">
                      <input type="number" value={tableForm.number} onChange={e => setTableForm(p=>({...p,number:e.target.value}))} className="input-dark" required />
                    </Field>
                    <Field label="Seats *">
                      <input type="number" value={tableForm.capacity} onChange={e => setTableForm(p=>({...p,capacity:e.target.value}))} className="input-dark" required />
                    </Field>
                    <Field label="Location">
                      <select value={tableForm.location} onChange={e => setTableForm(p=>({...p,location:e.target.value}))} className="select-dark">
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor / Patio</option>
                        <option value="vip">VIP / Private</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-3 flex gap-3">
                      <button type="submit" className="px-7 py-3 rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>Add Table</button>
                      <button type="button" onClick={() => setShowAddTable(false)} className="px-7 py-3 rounded-xl text-sm font-semibold text-text-secondary"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-[22px] overflow-hidden" style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="data-table" style={{ minWidth: "500px" }}>
                  <thead><tr><th>Table #</th><th>Seats</th><th>Location</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {tables.length === 0
                      ? <tr><td colSpan="5" className="py-12 text-center" style={{ color: "#4A5568" }}>No tables configured yet.</td></tr>
                      : tables.map(t => (
                        <tr key={t._id || t.id}>
                          <td><span className="font-serif font-bold text-xl text-white">T{t.number}</span></td>
                          <td><span className="text-white">{t.capacity}</span> <span className="text-text-muted text-xs">seats</span></td>
                          <td><span className="badge badge-blue capitalize">{t.location || "indoor"}</span></td>
                          <td><span className="badge badge-green">Available</span></td>
                          <td className="text-right">
                            <button onClick={() => setTables(p => p.filter(x => (x._id||x.id) !== (t._id||t.id)))}
                              className="text-xs font-semibold transition-colors" style={{ color: "#EF4444" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#FCA5A5"}
                              onMouseLeave={e => e.currentTarget.style.color = "#EF4444"}>Remove</button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ RESERVATIONS TAB ══════════════════════════════ */}
        {activeTab === "reservations" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-serif text-3xl font-bold text-white">Reservations</h1>
                <p className="text-text-secondary text-sm mt-1">
                  {selectedRestaurant ? `Bookings for ${selectedRestaurant.name}` : "Select a restaurant first"}
                </p>
              </div>
              {reservations.length > 0 && (
                <span className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: "rgba(44,122,92,0.12)", color: "#2C7A5C", border: "1px solid rgba(44,122,92,0.2)" }}>
                  {reservations.length} total
                </span>
              )}
            </div>

            {!selectedRestaurant && (
              <div className="py-16 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p className="text-text-secondary text-sm">Select a restaurant from the Overview tab.</p>
              </div>
            )}
            {selectedRestaurant && reservationsLoading && (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
              </div>
            )}
            {selectedRestaurant && !reservationsLoading && reservations.length === 0 && (
              <div className="py-16 text-center rounded-[22px]" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <span className="text-4xl block mb-3 opacity-30">📅</span>
                <p className="text-text-secondary text-sm">No reservations yet for this restaurant.</p>
                <p className="text-xs mt-1" style={{ color: "#2A3545" }}>Bookings will appear here once customers reserve a table.</p>
              </div>
            )}
            {selectedRestaurant && !reservationsLoading && reservations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((b, idx) => {
                  const po = preOrders.find(p => p.bookingId === b._id);
                  const status = b.status || "pending";
                  const actions = BOOKING_ACTIONS[status] || [];
                  return (
                    <motion.div key={b._id || idx}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      className="rounded-[20px] p-5"
                      style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#4A5568" }}>Date</p>
                          <p className="font-serif font-bold text-white text-lg leading-none">{b.date}</p>
                        </div>
                        <span className={`badge ${statusBadgeClass(status)}`}>{status}</span>
                      </div>
                      <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "#8B9CB5" }}>Payment</span>
                          <span className="font-bold" style={{ color: b.paymentStatus === "completed" ? "#2C7A5C" : "#C8A96A" }}>
                            {b.paymentStatus || "pending"}
                          </span>
                        </div>
                        {b.totalAmount > 0 && (
                          <div className="flex justify-between text-xs mt-2">
                            <span style={{ color: "#8B9CB5" }}>Paid Amount</span>
                            <span className="font-bold text-white">₹{b.totalAmount}</span>
                          </div>
                        )}
                      </div>
                      <div className="divider mb-4" />
                      <div className="grid grid-cols-3 gap-3 text-center mb-4">
                        {[["Time", b.time], ["Guests", b.guests], ["Phone", b.phone]].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4A5568" }}>{l}</p>
                            <p className="font-semibold text-white text-sm mt-1 truncate">{v}</p>
                          </div>
                        ))}
                      </div>
                      {po && (
                        <div className="pt-3 mt-3" style={{ borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
                          <span className="badge badge-gold text-xs mb-3 inline-block">Pre-Order Attached</span>
                          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            {po.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-white">{item.quantity}× {item.name}</span>
                                <span className="text-text-secondary">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                            <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4A5568" }}>Total</span>
                              <span className="font-serif font-bold text-white text-sm">₹{po.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {actions.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          {actions.map(action => (
                            <button
                              key={action.status}
                              onClick={() => updateReservationStatus(b._id, action.status)}
                              disabled={updatingBookingId === b._id}
                              className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                              style={actionStyle(action.tone)}
                            >
                              {updatingBookingId === b._id ? "Updating..." : action.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 pt-4 text-xs font-semibold" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "#4A5568" }}>
                          No further actions available.
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
};

export default OwnerDashboard;
