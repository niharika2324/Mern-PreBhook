import PreOrder from "../model/PreOrder.js";

// POST /api/preorder/add
export const createPreOrder = async (req, res) => {
  try {
    const { bookingId, restaurantId, userId, items, totalAmount } = req.body;

    if (!restaurantId || !items || !totalAmount) {
      return res.status(400).json({ success: false, message: "Missing required fields for preorder." });
    }

    const orderType = bookingId ? "pre-order" : "direct";

    const preOrder = new PreOrder({
      bookingId: bookingId || null,
      restaurantId,
      userId: userId || null,
      orderType,
      items,
      totalAmount,
      status: "pending"
    });

    await preOrder.save();

    return res.status(201).json({
      success: true,
      message: "Pre-order placed successfully! Your food will be prepared in advance.",
      data: preOrder
    });
  } catch (error) {
    console.error("createPreOrder error:", error);
    return res.status(500).json({ success: false, message: "Server error. Could not place pre-order." });
  }
};

// GET /api/preorder/:bookingId
export const getPreOrderByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const preOrder = await PreOrder.findOne({ bookingId });
    
    if (!preOrder) {
      return res.status(404).json({ success: false, message: "Pre-order not found for this booking." });
    }

    return res.status(200).json({ success: true, data: preOrder });
  } catch (error) {
    console.error("getPreOrderByBooking error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching pre-order." });
  }
};

// GET /api/preorder/restaurant/:restaurantId
export const getPreOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const preOrders = await PreOrder.find({ restaurantId }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, data: preOrders });
  } catch (error) {
    console.error("getPreOrdersByRestaurant error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching pre-orders." });
  }
};

// GET /api/preorder/user/:userId
export const getPreOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const preOrders = await PreOrder.find({ userId }).populate("restaurantId", "name location image").sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, data: preOrders });
  } catch (error) {
    console.error("getPreOrdersByUser error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching user pre-orders." });
  }
};
