import Booking from "../model/Booking.js";
import Restaurant from "../model/Restaurant.js";
import Review from "../model/Review.js";

const recalculateRestaurantRating = async (restaurantId) => {
  const stats = await Review.aggregate([
    { $match: { restaurantId } },
    {
      $group: {
        _id: "$restaurantId",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const ratingAverage = stats[0]?.ratingAverage ? Number(stats[0].ratingAverage.toFixed(1)) : 0;
  const ratingCount = stats[0]?.ratingCount || 0;

  await Restaurant.findByIdAndUpdate(restaurantId, { ratingAverage, ratingCount });
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const { restaurantId, bookingId, rating, comment = "" } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId || !restaurantId || !bookingId || !rating) {
      return res.status(400).json({ success: false, message: "Restaurant, booking, and rating are required." });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      restaurantId,
      userId,
      status: "confirmed",
    });

    if (!booking) {
      return res.status(403).json({ success: false, message: "Only confirmed bookings can be reviewed." });
    }

    const review = await Review.findOneAndUpdate(
      { bookingId },
      {
        restaurantId,
        userId,
        bookingId,
        rating: numericRating,
        comment: String(comment).slice(0, 500),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("userId", "name");

    await recalculateRestaurantRating(review.restaurantId);

    return res.status(200).json({ success: true, message: "Review saved.", data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This booking has already been reviewed." });
    }
    console.error("createOrUpdateReview error:", error);
    return res.status(500).json({ success: false, message: "Could not save review." });
  }
};

export const getReviewsByRestaurant = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not fetch reviews." });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId })
      .populate("restaurantId", "name location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not fetch user reviews." });
  }
};
