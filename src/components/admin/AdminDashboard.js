import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const TABS = [
  { id: "users",       label: "Users",       icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { id: "restaurants", label: "Restaurants", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "bookings",    label: "Bookings",    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: "orders",      label: "Orders",      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (!u || u.role !== "admin") { navigate("/"); return; }
      axiosInstance.get("/api/users/all").then(r => setUsers(r.data.data || [])).catch(() => toast.error("Could not load users."));
      axiosInstance.get("/api/users/all-restaurants").then(r => setRestaurants(r.data.data || [])).catch(() => toast.error("Could not load restaurants."));
      setBookings(JSON.parse(localStorage.getItem("bookings") || "[]"));
      setOrders(JSON.parse(localStorage.getItem("preorders") || "[]"));
    } catch { navigate("/"); }
  }, [navigate]);

  const handleDeleteUser = async (id) => {
    try { await axiosInstance.delete(`/api/users/delete-user/${id}`); setUsers(p => p.filter(u => u._id !== id)); }
    catch (e) { toast.error("Could not delete user."); }
  };

  const handleApproveRestaurant = async (id) => {
    try {
      await axiosInstance.put(`/api/users/approve-restaurant/${id}`);
      const r = await axiosInstance.get("/api/users/all-restaurants");
      setRestaurants(r.data.data || []);
    } catch (e) { toast.error("Could not approve restaurant."); }
  };

  const handleEditUser = async (user) => {
    const newName = prompt("Enter new name:", user.name);
    const newRole = prompt("Enter role (user/owner/admin):", user.role);
    if (!newName || !newRole) return;
    try {
      const r = await axiosInstance.put(`/api/users/update-user/${user._id}`, { name: newName, role: newRole });
      setUsers(p => p.map(u => u._id === user._id ? r.data.data : u));
    } catch (e) { toast.error("Could not update user."); }
  };

  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch {}

  const stats = [
    { label: "Total Users",   value: users.length,                                  color: "#60A5FA", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Owners",        value: users.filter(u => u.role === "owner").length,  color: "#C8A96A", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { label: "Bookings",      value: bookings.length,                                color: "#2C7A5C", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { label: "Pre-Orders",    value: orders.length,                                  color: "#F472B6", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  ];

  const tableTitle = { users: "Registered Users", restaurants: "Restaurant Directory", bookings: "Global Reservations", orders: "Pre-Order Log" };

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#080C12" }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-60 hidden md:flex flex-col sticky top-[72px] flex-shrink-0"
        style={{ background: "#0A0D14", borderRight: "1px solid rgba(255,255,255,0.05)", height: "calc(100vh - 72px)" }}>
        <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)" }}>PB</div>
          <div>
            <p className="font-serif font-bold text-white text-sm leading-none">PreBhookh</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#60A5FA" }}>System Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`nav-item w-full ${activeTab === t.id ? "active" : ""}`}
              style={activeTab === t.id ? { background: "rgba(37,99,235,0.12)", color: "#60A5FA", borderColor: "rgba(37,99,235,0.25)" } : {}}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {currentUser && (
          <div className="p-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-xs truncate" style={{ color: "#4A5568" }}>Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "#EF4444" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Secure Logout
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-5 md:p-8 pt-24 min-w-0">
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background: activeTab === t.id ? "rgba(37,99,235,0.12)" : "#0E1520",
                color: activeTab === t.id ? "#60A5FA" : "#8B9CB5",
                border: activeTab === t.id ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(255,255,255,0.06)"
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white">Platform Administration</h1>
            <p className="text-text-secondary text-sm mt-1">Monitor and manage all system activities.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="stat-card group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                  style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, color: s.color }}>
                  {s.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#4A5568" }}>{s.label}</p>
                <p className="font-serif text-4xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-[22px] overflow-hidden" style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-serif text-lg font-bold text-white">{tableTitle[activeTab]}</h2>
              <span className="badge badge-blue">
                {activeTab === "users" ? users.length : activeTab === "restaurants" ? restaurants.length : activeTab === "bookings" ? bookings.length : orders.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table" style={{ minWidth: "700px" }}>
                <thead>
                  <tr>
                    {activeTab === "users" && <><th>User</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></>}
                    {activeTab === "restaurants" && <><th>Establishment</th><th>Location</th><th>Verification</th><th className="text-right">Actions</th></>}
                    {activeTab === "bookings" && <><th>Restaurant</th><th>Guest</th><th>Schedule</th><th className="text-right">Status</th></>}
                    {activeTab === "orders" && <><th>Restaurant</th><th>Items</th><th>Value</th><th className="text-right">Status</th></>}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === "users" && (
                    users.length === 0
                      ? <tr><td colSpan="4" className="py-12 text-center" style={{ color: "#4A5568" }}>No records found.</td></tr>
                      : users.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: u.role === "admin" ? "rgba(239,68,68,0.2)" : u.role === "owner" ? "rgba(200,169,106,0.2)" : "rgba(96,165,250,0.2)" }}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{u.name || "Anonymous"}</p>
                                <p className="text-xs" style={{ color: "#4A5568" }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${u.role === "admin" ? "badge-red" : u.role === "owner" ? "badge-gold" : "badge-blue"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-success" />
                              <span className="text-xs font-medium text-success">Active</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <button onClick={() => handleEditUser(u)} className="text-xs font-semibold text-text-secondary hover:text-white mr-4 transition-colors">Modify</button>
                            <button onClick={() => handleDeleteUser(u._id)} className="text-xs font-semibold transition-colors" style={{ color: "#EF4444" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#FCA5A5"}
                              onMouseLeave={e => e.currentTarget.style.color = "#EF4444"}>Revoke</button>
                          </td>
                        </tr>
                      ))
                  )}

                  {activeTab === "restaurants" && (
                    restaurants.length === 0
                      ? <tr><td colSpan="4" className="py-12 text-center" style={{ color: "#4A5568" }}>No records found.</td></tr>
                      : restaurants.map(r => (
                        <tr key={r._id}>
                          <td>
                            <p className="font-serif font-bold text-white">{r.name}</p>
                            <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "#4A5568" }}>{r.cuisine}</p>
                          </td>
                          <td className="text-text-secondary text-sm">{r.location || "N/A"}</td>
                          <td>
                            <span className={`badge ${r.isApproved ? "badge-green" : "badge-amber"}`}>
                              {r.isApproved ? "Verified" : "Pending Review"}
                            </span>
                          </td>
                          <td className="text-right">
                            {!r.isApproved
                              ? <button onClick={() => handleApproveRestaurant(r._id)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                                  style={{ background: "#2C7A5C" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#3A9970"}
                                  onMouseLeave={e => e.currentTarget.style.background = "#2C7A5C"}>
                                  Approve
                                </button>
                              : <span className="text-xs" style={{ color: "#4A5568" }}>Live</span>
                            }
                          </td>
                        </tr>
                      ))
                  )}

                  {activeTab === "bookings" && (
                    bookings.length === 0
                      ? <tr><td colSpan="4" className="py-12 text-center" style={{ color: "#4A5568" }}>No records found.</td></tr>
                      : bookings.map((b, i) => (
                        <tr key={i}>
                          <td className="font-bold text-white">{b.restaurantName || b.restaurant || "N/A"}</td>
                          <td>
                            <p className="text-sm font-semibold text-white">{b.guestName || "Walk-in Guest"}</p>
                            <p className="text-xs" style={{ color: "#4A5568" }}>{b.guests || 2} pax</p>
                          </td>
                          <td className="text-text-secondary text-sm">{b.date || "Today"} · {b.time || "Immediate"}</td>
                          <td className="text-right"><span className="badge badge-green">Confirmed</span></td>
                        </tr>
                      ))
                  )}

                  {activeTab === "orders" && (
                    orders.length === 0
                      ? <tr><td colSpan="4" className="py-12 text-center" style={{ color: "#4A5568" }}>No records found.</td></tr>
                      : orders.map((o, i) => (
                        <tr key={i}>
                          <td className="font-bold text-white">{o.restaurantName || "N/A"}</td>
                          <td className="text-text-secondary">{o.items?.length || 0} items</td>
                          <td className="font-serif font-bold text-white">₹{o.total?.toFixed(2) || "0.00"}</td>
                          <td className="text-right"><span className="badge badge-blue">Processing</span></td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
