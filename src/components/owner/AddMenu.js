import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const AddMenu = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", price: "", category: "appetizer", description: "",
  });
  const [image, setImage] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || 'null');
      if (!currentUser || currentUser.role !== "owner") return navigate("/");
      const restaurantRes = await axiosInstance.get(`/api/users/restaurants/owner/${currentUser._id}`);
      const restaurantData = restaurantRes.data.data;
      const restaurant = Array.isArray(restaurantData) ? restaurantData[0] : restaurantData;

      if (!restaurant) return toast.error("Please add a restaurant first in your dashboard.");

      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("price", formData.price);
      formDataObj.append("category", formData.category);
      formDataObj.append("description", formData.description);
      formDataObj.append("restaurantId", restaurant._id);
      if (image) formDataObj.append("image", image);

      await toast.promise(
        axiosInstance.post("/api/users/add-menu", formDataObj, { headers: { "Content-Type": "multipart/form-data" } }),
        {
          loading: "Publishing dish...",
          success: "Menu item added successfully.",
          error: "Error adding menu.",
        }
      );
      setFormData({ name: "", price: "", category: "appetizer", description: "" });
      setImage(null);
      navigate("/owner/dashboard");
    } catch (error) {
      toast.error("Could not prepare menu form.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white rounded-[32px] p-8 md:p-12 shadow-float border border-gray-100">
        <div className="text-center mb-10">
          <span className="text-4xl mb-4 block">🍳</span>
          <h1 className="font-serif text-3xl font-bold text-brand-dark mb-2">Add Menu Item</h1>
          <p className="text-gray-500 text-sm tracking-wide">Introduce a new culinary masterpiece to your menu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Dish Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium" placeholder="E.g., Truffle Pasta" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium" placeholder="0.00" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium appearance-none">
                <option value="appetizer">Appetizer</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Dish Image</label>
              <input type="file" name="image" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="w-full px-5 py-3.5 bg-surface border border-gray-200 text-sm rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 outline-none cursor-pointer" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none text-brand-dark font-medium resize-none placeholder:text-gray-400" placeholder="Describe the flavors, ingredients, and presentation..."></textarea>
          </div>

          <div className="pt-6 flex flex-col md:flex-row gap-4">
            <button type="submit" className="w-full bg-brand text-white font-bold tracking-widest uppercase text-sm py-4 rounded-full hover:bg-brand-light shadow-md transition-all active:scale-[0.98]">Publish Dish</button>
            <button type="button" onClick={() => navigate("/owner/dashboard")} className="w-full bg-white border border-gray-200 text-gray-600 font-bold tracking-widest uppercase text-sm py-4 rounded-full hover:bg-gray-50 transition-all active:scale-[0.98]">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddMenu;
