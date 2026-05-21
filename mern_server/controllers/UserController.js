import User from "../model/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateEmail, validateName } from "../utils/validators.js";
import { sendOTPEmail } from "../utils/mailer.js";

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── REGISTER — saves user, sends OTP, does NOT issue token yet ────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ status: 0, message: "Name, email, and password are required" });

    if (!validateName(name))
      return res.status(400).json({ status: 0, message: "Name must be between 2-50 characters" });

    if (!validateEmail(email))
      return res.status(400).json({ status: 0, message: "Please provide a valid email address" });

    if (password.length < 6)
      return res.status(400).json({ status: 0, message: "Password must be at least 6 characters long" });

    const existing = await User.findOne({ email });
    if (existing) {
      // If account exists but email not verified, resend OTP instead of rejecting
      if (!existing.isEmailVerified) {
        const otp = generateOTP();
        existing.otp       = otp;
        existing.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await existing.save();
        await sendOTPEmail(email, otp);
        return res.status(200).json({
          status: 1,
          message: "Account already exists but is unverified. A new OTP has been sent.",
          userId: existing._id,
          email,
        });
      }
      return res.status(400).json({ status: 0, message: "Email already registered. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isEmailVerified: false,
      otp,
      otpExpiry,
    });

    await user.save();

    // Send OTP — if email sending fails we still return userId so user can retry
    try {
      await sendOTPEmail(email, otp);
    } catch (mailErr) {
      console.error("Mail send failed:", mailErr.message);
      // Don't block registration — OTP is in DB, user can use resend
    }

    res.status(201).json({
      status: 1,
      message: "OTP sent to your email. Please verify to complete registration.",
      userId: user._id,
      email,
    });
  } catch (error) {
    res.status(500).json({ status: 0, message: "Server Error", error: error.message });
  }
};

// ── VERIFY OTP — confirms email, issues token ─────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp)
      return res.status(400).json({ status: 0, message: "userId and OTP are required" });

    const user = await User.findById(userId).select("+otp +otpExpiry");

    if (!user)
      return res.status(404).json({ status: 0, message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ status: 0, message: "Email is already verified. Please login." });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ status: 0, message: "No OTP found. Please request a new one." });

    if (user.otp !== String(otp))
      return res.status(400).json({ status: 0, message: "Incorrect OTP. Please try again." });

    if (user.otpExpiry < new Date())
      return res.status(400).json({ status: 0, message: "OTP has expired. Please request a new one." });

    // Mark verified and clear OTP fields
    user.isEmailVerified = true;
    user.otp       = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      status: 1,
      message: "Email verified successfully!",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ status: 0, message: "Server Error", error: error.message });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId)
      return res.status(400).json({ status: 0, message: "userId is required" });

    const user = await User.findById(userId).select("+otp +otpExpiry");

    if (!user)
      return res.status(404).json({ status: 0, message: "User not found" });

    if (user.isEmailVerified)
      return res.status(400).json({ status: 0, message: "Email is already verified." });

    const otp = generateOTP();
    user.otp       = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({ status: 1, message: "New OTP sent to your email." });
  } catch (error) {
    res.status(500).json({ status: 0, message: "Server Error", error: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ status: 0, message: "Email and password are required" });

    if (!validateEmail(email))
      return res.status(400).json({ status: 0, message: "Please provide a valid email address" });

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(401).json({ status: 0, message: "Invalid email or password" });

    // Block login if email not verified
    if (!user.isEmailVerified)
      return res.status(403).json({
        status: 0,
        message: "Please verify your email first. Check your inbox for the OTP.",
        userId: user._id,
        email: user.email,
        requiresVerification: true,
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ status: 0, message: "Invalid email or password" });

    const token = generateToken(user);
    user.password = undefined;

    res.status(200).json({ status: 1, message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ status: 0, message: "Server Error", error: error.message });
  }
};

// ── ADMIN: GET ALL USERS ──────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ status: 1, data: users });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

// ── ADMIN: DELETE USER ────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 1, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};

// ── ADMIN: UPDATE USER ────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;
    if (name && !validateName(name))
      return res.status(400).json({ status: 0, message: "Name must be between 2-50 characters" });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, role },
      { new: true }
    ).select("-password");

    res.status(200).json({ status: 1, message: "User updated successfully", data: updatedUser });
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
};
