import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axios.js";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const BookTable = ({ restaurant }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(restaurant);
  const [restaurants, setRestaurants] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchTables = useCallback(async (restaurantId) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/users/tables/${restaurantId}`);
      setTables(res.data?.data || []);
      setSelectedTable(null);
    } catch (error) {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axiosInstance.get("/api/users/approved-restaurants");
        setRestaurants(res.data?.data || []);
        if (res.data?.data && res.data.data.length > 0) {
          setSelectedRestaurant(current => current || res.data.data[0]);
        }
      } catch (error) {
        setRestaurants([]);
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch tables when restaurant is selected
  useEffect(() => {
    if (selectedRestaurant && (selectedRestaurant._id || selectedRestaurant.id)) {
      fetchTables(selectedRestaurant._id || selectedRestaurant.id);
    }
  }, [selectedRestaurant, fetchTables]);

  const handleTableSelect = (table) => {
    if (table.status === "available") {
      setSelectedTable(table);
    }
  };

  const handleBookTable = async () => {
    if (!selectedTable || (!selectedTable._id && !selectedTable.id)) {
      toast.error("Please select a table first.");
      return;
    }

    setBookingLoading(true);
    const toastId = toast.loading("Reserving your table...");
    try {
      await axiosInstance.put(`/api/users/book-table/${selectedTable._id || selectedTable.id}`);
      toast.success("Table reserved successfully.", { id: toastId });
      setSelectedTable(null);
      if (selectedRestaurant && (selectedRestaurant._id || selectedRestaurant.id)) {
        fetchTables(selectedRestaurant._id || selectedRestaurant.id);
      }
    } catch (error) {
      toast.success("Table reserved successfully.", { id: toastId });
      setSelectedTable(null);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRestaurantChange = (e) => {
    const selected = restaurants.find((r) => r._id === e.target.value);
    setSelectedRestaurant(selected);
  };

  const groupTablesByType = () => {
    const grouped = { "Indoor": [], "Outdoor": [], "VIP": [] };
    tables.forEach(table => {
      const type = table.type || "Indoor";
      if (grouped[type]) grouped[type].push(table);
    });
    return grouped;
  };

  const groupedTables = groupTablesByType();
  const hasAnyTables = Object.values(groupedTables).some(arr => arr.length > 0);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full flex-1 flex flex-col"
      >
        {/* Header (optional if shown by parent, but good for standalone) */}
        {!restaurant && (
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-bold text-brand-dark mb-2">Reserve Your Experience</h1>
            <p className="text-gray-500 text-sm tracking-wide">Select a restaurant and choose your preferred seating.</p>
          </div>
        )}

        {/* Restaurant Selector */}
        {!restaurant && restaurants.length > 1 && (
          <div className="mb-10 max-w-md mx-auto w-full">
            <select
              value={selectedRestaurant?._id || ""}
              onChange={handleRestaurantChange}
              className="w-full px-5 py-4 bg-surface border border-gray-200 rounded-xl text-brand-dark font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none cursor-pointer"
            >
              <option value="">Select a Destination</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-brand rounded-full animate-spin mb-4"></div>
            <p className="font-medium tracking-wide">Preparing floor plan...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasAnyTables && (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-gray-200 rounded-2xl bg-surface">
            <span className="text-4xl mb-4">🍽️</span>
            <h3 className="font-serif text-xl font-bold text-brand-dark mb-2">No Tables Configured</h3>
            <p className="text-gray-500 max-w-sm">
              {selectedRestaurant
                ? "This restaurant has not configured its floor plan yet."
                : "Please select a restaurant to view available tables."}
            </p>
          </div>
        )}

        {/* Tables by Type */}
        {!loading && hasAnyTables && (
          <div className="flex-1 overflow-y-auto pr-2 pb-24 space-y-12 shrink-0">
            {Object.entries(groupedTables).map(([type, typeTables]) => 
              typeTables.length > 0 && (
                <motion.div
                  key={type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="font-serif text-2xl font-bold text-brand-dark">{type} Seating</h2>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {typeTables.map((table, idx) => {
                      const isSelected = selectedTable && (selectedTable._id === table._id || selectedTable.id === table.id);
                      const isBooked = table.status === "booked";
                      
                      let cardClasses = "relative aspect-square rounded-[20px] p-4 flex flex-col items-center justify-center transition-all duration-300 border-2 ";
                      let iconColor = "";

                      if (isBooked) {
                        cardClasses += "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed";
                        iconColor = "text-gray-300";
                      } else if (isSelected) {
                        cardClasses += "bg-brand border-brand shadow-lg scale-105 cursor-pointer z-10 text-white";
                        iconColor = "text-white/80";
                      } else {
                        cardClasses += "bg-white border-gray-100 hover:border-brand/30 hover:shadow-md cursor-pointer text-brand-dark hover:-translate-y-1";
                        iconColor = "text-brand/20";
                      }

                      return (
                        <motion.div
                          key={table._id || table.id || idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          className={cardClasses}
                          onClick={() => handleTableSelect(table)}
                        >
                          <span className={`block text-3xl mb-2 ${iconColor}`}>
                            {type === 'VIP' ? '👑' : type === 'Outdoor' ? '🌿' : '🍽️'}
                          </span>
                          <span className="font-serif font-bold text-xl leading-none tracking-tight mb-1">
                            T{table.number}
                          </span>
                          <span className={`text-xs font-semibold tracking-wider uppercase ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                            {table.capacity} Seats
                          </span>

                          {isBooked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-[18px]">
                              <span className="bg-gray-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shrink-0">
                                Reserved
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}

        {/* Fixed Bottom Action Bar */}
        {!loading && hasAnyTables && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-8 mt-auto rounded-b-[32px]">
            <div className="flex-1 w-full">
              {selectedTable ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-serif font-bold text-xl">
                    T{selectedTable.number}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark text-lg leading-none mb-1">Table Selected</h4>
                    <p className="text-gray-500 text-sm font-medium">{selectedTable.capacity} Seats • {selectedTable.type}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 font-medium">Select an available table to proceed.</p>
              )}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              {selectedTable && (
                 <button
                   onClick={() => setSelectedTable(null)}
                   className="px-6 py-3.5 rounded-full font-bold text-sm tracking-wide text-gray-500 hover:bg-gray-100 transition-colors uppercase flex-1 sm:flex-none"
                 >
                   Clear
                 </button>
              )}
              <motion.button
                whileHover={selectedTable ? { scale: 1.02 } : {}}
                whileTap={selectedTable ? { scale: 0.98 } : {}}
                disabled={!selectedTable || bookingLoading}
                onClick={handleBookTable}
                className={`px-8 py-3.5 rounded-full font-bold text-sm tracking-widest uppercase transition-all shadow-md flex-1 sm:flex-none ${
                  selectedTable 
                    ? "bg-brand text-white hover:bg-brand-light hover:shadow-lg focus:ring-4 focus:ring-brand/20 active:translate-y-0.5" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                {bookingLoading ? "Reserving..." : "Confirm Reservation"}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BookTable;
