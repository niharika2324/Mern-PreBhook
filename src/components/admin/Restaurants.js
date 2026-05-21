import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);

  const fetchRestaurants = async () => {
    try {
      const res = await axiosInstance.get("/api/users/all-restaurants");
      setRestaurants(res.data.data);
    } catch (error) {
      toast.error("Could not load restaurants.");
    }
  };

  const handleApprove = async (id) => {
    try {
      await toast.promise(
        axiosInstance.put(`/api/users/approve-restaurant/${id}`),
        {
          loading: "Approving restaurant...",
          success: "Restaurant approved.",
          error: "Approval failed.",
        }
      );
      fetchRestaurants();
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark mb-2">Restaurant Approval</h1>
          <p className="text-gray-500 tracking-wide font-medium">Review and strictly authorize new establishments.</p>
        </div>

        {restaurants.length === 0 ? (
          <div className="bg-white border text-center border-dashed border-gray-200 rounded-2xl py-20 px-4">
             <span className="text-4xl inline-block mb-3 opacity-50">📋</span>
             <h3 className="font-serif text-xl font-bold text-gray-400">No Restaurants Found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface border-b border-gray-100">
                    <th className="py-5 px-8 text-xs font-bold uppercase tracking-wider text-gray-400">Establishment</th>
                    <th className="py-5 px-8 text-xs font-bold uppercase tracking-wider text-gray-400">Location</th>
                    <th className="py-5 px-8 text-xs font-bold uppercase tracking-wider text-gray-400">Verification Status</th>
                    <th className="py-5 px-8 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r) => (
                    <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-8 border-l-4 border-transparent hover:border-brand-dark">
                        <div className="flex flex-col">
                          <span className="font-serif font-bold text-xl text-brand-dark">{r.name}</span>
                          <span className="text-xs font-semibold uppercase tracking-widest text-brand mt-0.5">{r.cuisine}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-gray-600 font-medium">{r.location || "N/A"}</td>
                      <td className="py-5 px-8">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                          r.isApproved ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                        }`}>
                          {r.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        {!r.isApproved ? (
                          <button onClick={() => handleApprove(r._id)} className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-black transition-all shadow-sm active:scale-95">
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Clear</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Restaurants;
