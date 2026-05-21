import Menu from "../model/Menu.js";
import fs from "fs";
import path from "path";

// ── ADD MENU ITEM ─────────────────────────────────────────────────────────────
export const addMenu = async (req, res) => {
  try {
    const { name, price, category, description, restaurantId } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const menu = new Menu({ name, price, category, description, restaurantId, image: imagePath });
    await menu.save();

    res.status(200).json({ message: "Menu item added", data: menu });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE MENU ITEM ──────────────────────────────────────────────────────────
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description } = req.body;

    const existing = await Menu.findById(id);
    if (!existing) return res.status(404).json({ message: "Menu item not found" });

    const updateData = { name, price, category, description };

    if (req.file) {
      // Replace old image
      if (existing.image) {
        const oldPath = path.resolve(existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = req.file.path.replace(/\\/g, "/");
    }

    const updated = await Menu.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Menu item updated", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE MENU ITEM ──────────────────────────────────────────────────────────
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Menu.findById(id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    // Delete image file if present
    if (item.image) {
      const imgPath = path.resolve(item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Menu.findByIdAndDelete(id);
    res.status(200).json({ message: "Menu item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET MENU BY RESTAURANT ────────────────────────────────────────────────────
export const getMenuByRestaurant = async (req, res) => {
  try {
    const menu = await Menu.find({ restaurantId: req.params.restaurantId });
    res.status(200).json({ status: 1, data: menu });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
