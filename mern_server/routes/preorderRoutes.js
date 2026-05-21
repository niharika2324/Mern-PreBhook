import express from 'express';
import { createPreOrder, getPreOrderByBooking, getPreOrdersByRestaurant, getPreOrdersByUser } from '../controllers/PreOrderController.js';

const router = express.Router();

router.post('/add', createPreOrder);
router.get('/restaurant/:restaurantId', getPreOrdersByRestaurant);
router.get('/user/:userId', getPreOrdersByUser);
router.get('/:bookingId', getPreOrderByBooking);

export default router;
