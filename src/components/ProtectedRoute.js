import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Checks if user is logged in and has required role before allowing access
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ element, requiredRole = null }) => {
  // Get current user from localStorage
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    // Check if user is logged in
    if (!currentUser) {
      // Not logged in - redirect to login
      return <Navigate to="/" replace />;
    }

    // If specific role is required, check it
    if (requiredRole && currentUser.role !== requiredRole) {
      // User doesn't have required role - redirect to their dashboard or login
      return <Navigate to="/" replace />;
    }

    // User is authenticated and has required role - render the component
    return element;
  } catch (error) {
    console.error("Error in ProtectedRoute:", error);
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
