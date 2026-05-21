// ⚠ Must be the very first import so env vars are available to all modules
import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import db from './db.js';
import router from './routes/routes.js';
import preorderRouter from './routes/preorderRoutes.js';

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// API ROUTES
app.use('/api/users', router);
app.use('/api/preorder', preorderRouter);

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant API Server',
    status: 'Running',
    version: '1.0.0'
  });
});

// 404 ERROR HANDLER
app.use((req, res) => {
  res.status(404).json({
    status: 0,
    message: "Route not found"
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 0,
    message: err.message || "Internal Server Error"
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✓ Server is running on port ${port}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
