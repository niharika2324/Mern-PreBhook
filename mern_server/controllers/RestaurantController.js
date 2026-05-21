import Restaurant from "../model/Restaurant.js";
import fs from "fs";
import path from "path";

// ── ADD RESTAURANT (with optional image) ──────────────────────────────────────
export const addRestaurant = async (req, res) => {
  try {
    const { name, location, cuisine, ownerId, maxCapacity } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const restaurant = new Restaurant({
      name,
      location,
      cuisine,
      ownerId,
      image: imagePath,
      maxCapacity: maxCapacity ? Number(maxCapacity) : 40,
    });

    await restaurant.save();

    res.status(200).json({
      message: "Restaurant added, waiting for admin approval",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE RESTAURANT ─────────────────────────────────────────────────────────
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, cuisine, maxCapacity } = req.body;

    const existing = await Restaurant.findById(id);
    if (!existing) return res.status(404).json({ message: "Restaurant not found" });

    const updateData = { name, location, cuisine };
    if (maxCapacity) updateData.maxCapacity = Number(maxCapacity);

    // If a new image is uploaded, replace the old one
    if (req.file) {
      // Delete old image file if it exists
      if (existing.image) {
        const oldPath = path.resolve(existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = req.file.path.replace(/\\/g, "/");
    }

    const updated = await Restaurant.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ message: "Restaurant updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE RESTAURANT ─────────────────────────────────────────────────────────
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    // Delete image file if present
    if (restaurant.image) {
      const imgPath = path.resolve(restaurant.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Restaurant.findByIdAndDelete(id);
    res.status(200).json({ message: "Restaurant deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL RESTAURANTS (ADMIN) ───────────────────────────────────────────────
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json({ status: 1, data: restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── APPROVE RESTAURANT ────────────────────────────────────────────────────────
export const approveRestaurant = async (req, res) => {
  try {
    await Restaurant.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.status(200).json({ message: "Restaurant approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET APPROVED RESTAURANTS (PUBLIC) ─────────────────────────────────────────
export const getApprovedRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isApproved: true });
    res.status(200).json({ status: 1, data: restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET RESTAURANTS BY OWNER ──────────────────────────────────────────────────
export const getRestaurantByOwner = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ ownerId: req.params.ownerId });
    res.status(200).json({ status: 1, data: restaurants });
  } catch (error) {
    res.status(500).json({ status: 0, message: "Error fetching restaurants" });
  }
};
