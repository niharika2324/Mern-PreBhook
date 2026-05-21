import Table from "../model/Table.js";
import mongoose from "mongoose";

// ADD TABLE
export const addTable = async (req, res) => {
  try {
    const { restaurantId, number, capacity, location } = req.body;

    const table = new Table({
      restaurantId,
      number,
      capacity,
      location: location || "indoor",
      status: "available"
    });

    await table.save();

    res.status(200).json({
      status: 1,
      message: "Table added successfully",
      data: table
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TABLES BY RESTAURANT
export const getTablesByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid restaurant ID"
      });
    }

    const tables = await Table.find({ restaurantId });

    res.status(200).json({
      status: 1,
      data: tables
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BOOK TABLE
export const bookTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid table ID"
      });
    }

    const table = await Table.findByIdAndUpdate(
      tableId,
      { status: "booked" },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        status: 0,
        message: "Table not found"
      });
    }

    res.status(200).json({
      status: 1,
      message: "Table booked successfully",
      data: table
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET TABLE (Optional - set status back to available)
export const resetTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid table ID"
      });
    }

    const table = await Table.findByIdAndUpdate(
      tableId,
      { status: "available" },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        status: 0,
        message: "Table not found"
      });
    }

    res.status(200).json({
      status: 1,
      message: "Table reset to available",
      data: table
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
