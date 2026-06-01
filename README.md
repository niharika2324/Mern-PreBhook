# PreBhook – AI-Assisted Restaurant Reservation Platform

## Overview

PreBhook is a full-stack restaurant reservation and food pre-ordering platform designed to reduce customer waiting time and streamline restaurant operations. The platform enables users to discover restaurants, browse menus, pre-order meals, reserve tables, and manage bookings through an intuitive and responsive interface.

The system also includes dedicated dashboards for restaurant owners and administrators, providing tools for restaurant management, booking tracking, menu management, and operational oversight.

---

## Features

### Customer Features

* User Registration & Authentication
* Email OTP Verification
* Restaurant Discovery
* Interactive Menu Browsing
* Food Pre-Ordering
* Table Reservation System
* Booking History Management
* AI-Powered Assistant
* Online Payment Integration
* Responsive User Experience

### Restaurant Owner Features

* Restaurant Management
* Menu Management
* Booking Management
* Order Tracking
* Dashboard Analytics
* Customer Reservation Monitoring

### Admin Features

* User Management
* Restaurant Approval & Monitoring
* Platform Oversight
* Booking Analytics
* System Administration Dashboard

---

## Technology Stack

### Frontend

* React.js
* React Router
* Axios
* Framer Motion
* Tailwind CSS / CSS3

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST APIs

### Database

* MongoDB
* Mongoose ODM

### Third-Party Services

* Razorpay (Payment Gateway)
* Twilio (SMS Notifications)
* Nodemailer (Email OTP Verification)

---

## System Architecture

User Interface (React.js)

↓

REST APIs (Express.js)

↓

Business Logic Layer

↓

MongoDB Database

↓

External Services (Razorpay, Twilio, Email Services)

---

## Key Highlights

* Full-stack MERN architecture
* Secure JWT authentication
* Role-based access control
* Payment gateway integration
* AI-assisted user experience
* Responsive and modern UI
* Scalable REST API architecture
* Modular component-based frontend design

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd Prebhook
```

### Install Frontend Dependencies

```bash
cd restroapp
npm install
```

### Install Backend Dependencies

```bash
cd ../mern_server
npm install
```

### Environment Variables

Create a `.env` file inside the backend directory:

```env
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Run Backend

```bash
npm run dev
```

### Run Frontend

```bash
npm start
```

---

## Future Enhancements

* AI-based Food Recommendation System
* Smart Reservation Prediction
* Real-Time Booking Notifications
* Restaurant Review Sentiment Analysis
* Advanced Analytics Dashboard
* Mobile Application Support

---

## Project Status

Actively Developed 🚀

---

## Author

Niharika Arora

BCA Student | Full Stack Developer | MERN Stack Enthusiast
