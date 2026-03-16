import express from "express";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/user.js";
import PendingUser from "../models/pendinguser.js";
import jwt from "jsonwebtoken";
import Department from "../models/department.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const SECRET = process.env.SECRET;
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (email, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "UniPortal",
          email: process.env.BREVO_SENDER,
        },
        to: [{ email }],
        subject: "Your Verification OTP",
        textContent: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    console.log("BREVO API MAIL SENT:", response.data);
    return true;
  } catch (err) {
    console.error("BREVO API ERROR:", err.response?.data || err.message);
    return false;
  }
};


router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const role = "student";

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required." });

    const inUsers = await User.findOne({ email });
    const inPending = await PendingUser.findOne({ email, isEmailVerified: true });

    if (inUsers) return res.status(400).json({ message: "Account already exists!" });
    if (inPending) return res.status(400).json({ message: "Signup already pending admin approval." });

    const hashed = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000);

    const emailSent = await sendOtpEmail(email, otp);
    if (!emailSent)
      return res.status(500).json({ message: "Failed to send verification email." });

    let pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) pendingUser = new PendingUser({ email });

    pendingUser.name = name;
    pendingUser.email = email;
    pendingUser.password = hashed;
    pendingUser.role = role; // 👈 auto student
    pendingUser.department = department;
    pendingUser.otp = otp;
    pendingUser.otpExpiresAt = otpExpiresAt;
    pendingUser.isEmailVerified = false;
    pendingUser.isApproved = false;

    await pendingUser.save();

    res.json({ message: "Verification code sent to your email." });
  } catch {
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser)
      return res.status(400).json({ message: "No pending signup request." });

    if (pendingUser.isEmailVerified)
      return res.status(400).json({ message: "Already verified." });

    if (pendingUser.otp !== otp)
      return res.status(401).json({ message: "Invalid OTP." });

    if (pendingUser.otpExpiresAt < new Date())
      return res.status(401).json({ message: "OTP expired." });

    pendingUser.isEmailVerified = true;
    pendingUser.otp = undefined;
    pendingUser.otpExpiresAt = undefined;
    await pendingUser.save();

    res.json({ message: "Verification successful. Pending admin approval." });
  } catch {
    res.status(500).json({ message: "OTP verification failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Login route hit");
console.log("Request body:", req.body);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const email = (req.body.email ?? "").trim();
    const password = (req.body.password ?? "").trim();

    const user = await User.findOne({ email });

    if (!user) {
      const pending = await PendingUser.findOne({ email });
      if (pending) {
        if (!pending.isEmailVerified)
          return res.status(401).json({ message: "Email not verified." });
        return res.status(401).json({ message: "Account pending admin approval." });
      }
      return res.status(400).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      redirect: `/${user.role}`, // 👈 auto dashboard
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
  console.error("LOGIN ERROR:", error);
  res.status(500).json({
    message: "Login error",
    error: error.message,
    stack: error.stack,
  });
}
});

export default router;
