import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/Navbar';
import UserDashboard from "./components/user/UserDashboard";
import RestaurantsPage from "./components/user/RestaurantsPage";
import RestaurantDetail from "./components/user/RestaurantDetail";
import ReserveTable from "./components/user/ReserveTable";
import UserPreOrder from "./components/user/UserPreOrder";
import UserBookings from "./components/user/UserBookings";
import OwnerDashboard from "./components/owner/OwnerDashboard";
import AddTable from "./components/owner/AddTable";
import AddMenu from "./components/owner/AddMenu";
import AdminDashboard from "./components/admin/AdminDashboard";
import Users from "./components/admin/Users";
import Restaurants from "./components/admin/Restaurants";
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import AIConcierge from './components/AIConcierge';
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#080C12", color: "#F1F5F9" }}>
      <BrowserRouter>
        <Navbar />
        <main className="flex-grow flex flex-col relative w-full">
          <Routes>
            {/* Auth */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User — main flow */}
            <Route path="/user/dashboard"  element={<ProtectedRoute element={<UserDashboard />}  requiredRole="user" />} />
            <Route path="/restaurants"     element={<ProtectedRoute element={<RestaurantsPage />} requiredRole="user" />} />
            <Route path="/restaurant/:restaurantId" element={<ProtectedRoute element={<RestaurantDetail />} requiredRole="user" />} />
            <Route path="/user/bookings"   element={<ProtectedRoute element={<UserBookings />}   requiredRole="user" />} />

            {/* Legacy routes — kept so old deep-links still work */}
            <Route path="/user/book-table" element={<ProtectedRoute element={<Navigate to="/restaurants" replace />} requiredRole="user" />} />
            <Route path="/book/:restaurantId" element={<ProtectedRoute element={<ReserveTable />} requiredRole="user" />} />
            <Route path="/preorder/:bookingId" element={<ProtectedRoute element={<UserPreOrder />} requiredRole="user" />} />
            <Route path="/menu/:restaurantId"  element={<ProtectedRoute element={<UserPreOrder />} requiredRole="user" />} />

            {/* Owner */}
            <Route path="/owner/dashboard" element={<ProtectedRoute element={<OwnerDashboard />} requiredRole="owner" />} />
            <Route path="/owner/add-table" element={<ProtectedRoute element={<AddTable />}       requiredRole="owner" />} />
            <Route path="/owner/add-menu"  element={<ProtectedRoute element={<AddMenu />}        requiredRole="owner" />} />

            {/* Admin */}
            <Route path="/admin/dashboard"    element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
            <Route path="/admin/users"        element={<ProtectedRoute element={<Users />}          requiredRole="admin" />} />
            <Route path="/admin/restaurants"  element={<ProtectedRoute element={<Restaurants />}    requiredRole="admin" />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <AIConcierge />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3600,
            style: {
              background: "rgba(14, 21, 32, 0.92)",
              color: "#F1F5F9",
              border: "1px solid rgba(200,169,106,0.22)",
              boxShadow: "0 18px 55px rgba(0,0,0,0.36), 0 0 36px rgba(44,122,92,0.14)",
              borderRadius: "16px",
              backdropFilter: "blur(18px)",
              fontWeight: 600,
            },
            success: { iconTheme: { primary: "#2C7A5C", secondary: "#F1F5F9" } },
            error: { iconTheme: { primary: "#F87171", secondary: "#F1F5F9" } },
            loading: { iconTheme: { primary: "#C8A96A", secondary: "#F1F5F9" } },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
