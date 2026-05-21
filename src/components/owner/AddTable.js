import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const AddTable = ({ selectedRestaurant }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ number: "", capacity: "", location: "indoor" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || 'null');
      if (!currentUser || currentUser.role !== "owner") return navigate("/");

      // For standalone route usage, it assumes selectedRestaurant is passed or it fails.
      // In actual production without dashboard, it would fetch restaurant first.
      if (!selectedRestaurant || !selectedRestaurant._id) {
        toast.error("Please access this from your Dashboard to link the correct restaurant.");
        navigate("/owner/dashboard");
        return;
      }

      await toast.promise(
        axiosInstance.post("/api/users/add-table", {
          restaurantId: selectedRestaurant._id,
          number: parseInt(formData.number), capacity: parseInt(formData.capacity), location: formData.location
        }),
        {
          loading: "Adding table...",
          success: "Table added successfully.",
          error: "Error adding table.",
        }
      );
      setFormData({ number: "", capacity: "", location: "indoor" });
      navigate("/owner/dashboard");
    } catch (error) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg bg-white rounded-[32px] p-8 md:p-12 shadow-float border border-gray-100">
        <div className="text-center mb-10">
          <span className="text-4xl mb-4 block">🪑</span>
          <h1 className="font-serif text-3xl font-bold text-brand-dark mb-2">Register Table</h1>
          <p className="text-gray-500 text-sm tracking-wide">Configure a new seating arrangement.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Table Number</label>
            <input type="number" name="number" value={formData.number} onChange={handleChange} className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium" placeholder="E.g., 12" required />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Capacity (Seats)</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium" placeholder="E.g., 4" required />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Dining Area</label>
            <select name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium appearance-none">
              <option value="indoor">Indoor Dining</option>
              <option value="outdoor">Outdoor / Patio</option>
              <option value="vip">VIP / Private</option>
            </select>
          </div>

          <div className="pt-6 flex flex-col gap-4">
            <button type="submit" className="w-full bg-brand text-white font-bold tracking-widest uppercase text-sm py-4 rounded-full hover:bg-brand-light shadow-md transition-all active:scale-[0.98]">Confirm Layout</button>
            <button type="button" onClick={() => navigate("/owner/dashboard")} className="w-full bg-white border border-gray-200 text-gray-600 font-bold tracking-widest uppercase text-sm py-4 rounded-full hover:bg-gray-50 transition-all active:scale-[0.98]">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTable;
