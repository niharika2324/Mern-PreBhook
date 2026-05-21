# JWT Authentication - Quick Reference for Frontend

## What Changed?

Your backend now requires authentication tokens for most API endpoints. All existing functionality is preserved, but protected routes now check for valid JWT tokens.

---

## 🔐 Public Routes (No Token Needed)

These endpoints work without authentication:

```javascript
// Register new user
POST /api/users/register
Body: { name, email, password, role? }

// Login
POST /api/users/login
Body: { email, password }

// View approved restaurants
GET /api/users/approved-restaurants

// Get menu for a restaurant
GET /api/users/menu/:restaurantId
```

---

## 🔒 Protected Routes (Token Required)

All other endpoints now require this header:

```
Authorization: Bearer <your_jwt_token>
```

### Examples:

```javascript
// Book a reservation
POST /api/users/book-reservation
Headers: { Authorization: "Bearer TOKEN" }
Body: { restaurantId, userId, date, time, guests, phone }

// Get user's bookings
GET /api/users/bookings/user/:userId
Headers: { Authorization: "Bearer TOKEN" }

// Add a restaurant (owner/admin only)
POST /api/users/add-restaurant
Headers: { Authorization: "Bearer TOKEN" }
Body: { name, location, cuisine, ownerId }
```

---

## 📱 Implementation in React

### 1. Store Token After Login

```javascript
const handleLogin = async (email, password) => {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.token) {
    // Store token in localStorage or sessionStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Store in state/context if using global state management
    setToken(data.token);
  }
};
```

### 2. Create API Helper Function

```javascript
// api.js or similar
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(endpoint, options);
  const data = await response.json();
  
  // Handle token expiration
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/login';
  }
  
  return data;
};
```

### 3. Use in Your Components

```javascript
// Booking example
const handleBooking = async (details) => {
  const result = await apiCall('/api/users/book-reservation', 'POST', {
    restaurantId: details.restaurantId,
    userId: details.userId,
    date: details.date,
    time: details.time,
    guests: details.guests,
    phone: details.phone
  });
  
  if (result.status === 1) {
    alert('Booking confirmed!');
  } else {
    alert('Booking failed: ' + result.message);
  }
};
```

### 4. Clear Token on Logout

```javascript
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  // Redirect to login
  navigate('/login');
};
```

### 5. Protected Route Component

```javascript
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ component: Component, requiredRole = null }) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <Component />;
};

// Usage in App.js
<Route 
  path="/admin/restaurants" 
  element={<ProtectedRoute component={AdminRestaurants} requiredRole="admin" />} 
/>
```

---

## 🔄 Token Lifecycle

| Event | Token Status | Action |
|-------|--------------|--------|
| User registers | ✅ Valid | Redirect to dashboard |
| User logs in | ✅ Valid | Store + Redirect |
| 7 days pass | ❌ Expired | User sees 401 error |
| User logs out | 🗑️ Deleted | Redirect to login |
| Wrong password | ❌ Invalid | Show error message |

---

## ⚠️ Error Handling

### 401 - Unauthorized (No/Invalid Token)
```javascript
{
  status: 0,
  message: "Access token required. Please login."
}
```
**Action**: Redirect to login page

### 403 - Forbidden (Insufficient Role)
```javascript
{
  status: 0,
  message: "Access denied. Required role(s): admin"
}
```
**Action**: Show error, redirect to dashboard

### 400 - Bad Request (Validation Failed)
```javascript
{
  status: 0,
  message: "Email and password are required"
}
```
**Action**: Show validation error to user

---

## 🧪 Testing with Postman

1. **Register or Login** to get token:
   - POST `/api/users/login`
   - Copy the `token` from response

2. **Set Authorization Header**:
   - Click "Authorization" tab
   - Type: `Bearer`
   - Token: `paste_your_token_here`

3. **Test Protected Endpoint**:
   - POST `/api/users/book-reservation`
   - Should work now

4. **Test Without Token**:
   - Remove authorization
   - Try the same endpoint
   - Should get 401 error

---

## 🔑 Example Request/Response

### Login Request
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "owner@restaurant.com",
  "password": "Password123"
}
```

### Login Response
```json
{
  "status": 1,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "owner@restaurant.com",
    "role": "owner",
    "createdAt": "2024-05-14T10:00:00.000Z"
  }
}
```

### Protected Request (with token)
```bash
GET /api/users/bookings/user/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Protected Response (with token)
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "restaurantId": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "date": "2024-05-20",
      "time": "19:00",
      "guests": 4,
      "status": "confirmed"
    }
  ]
}
```

---

## 💡 Tips

- ✅ Always store token securely (localStorage is okay for now, consider secure cookies in production)
- ✅ Clear token when user logs out
- ✅ Redirect to login when token is invalid/expired
- ✅ Show loading state while API request is in progress
- ✅ Handle network errors gracefully
- ⚠️ Don't expose token in console logs in production
- ⚠️ Token is valid for 7 days, user needs to login again after expiry

---

## ❓ Common Issues

**"Token required" Error**
- Make sure token is in `Authorization: Bearer <token>` format
- Check token hasn't expired (7 days)
- Verify token is stored correctly in frontend

**"Access denied. Required role: admin"**
- Check user's role in stored `user` object
- Only admins can access certain endpoints
- Use `ProtectedRoute` component to check role before rendering

**Blank Token**
- Make sure login request returned successfully
- Check API response for `token` field
- Verify email/password are correct

---

## 🎯 Ready to Implement?

Follow this checklist:

- [ ] Update login component to store token
- [ ] Create apiCall helper function
- [ ] Add token to all API requests
- [ ] Implement logout functionality
- [ ] Create ProtectedRoute component
- [ ] Handle 401/403 errors
- [ ] Test with Postman first
- [ ] Test in your React app
- [ ] Test different user roles

Good luck! 🚀
