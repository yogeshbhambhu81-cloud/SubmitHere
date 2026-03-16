import express from "express";
import User from "../models/user.js";
import PendingUser from "../models/pendinguser.js";
import Assignment from "../models/assignment.js";
import auth from "../middleware/auth.js";
import axios from "axios";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();
const router = express.Router();

/* ================= BREVO SMTP CONFIG ================= */

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY
  }
});

/* ================= SEND MAIL FUNCTION ================= */

const sendMail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: process.env.BREVO_SENDER, // Must be verified sender in Brevo
      to,
      subject,
      text
    });
  } catch (err) {
    console.error("MAIL ERROR:", err);
  }
};

/* ================= ADMIN CHECK ================= */

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};

/* ================= GET ALL USERS ================= */

router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const allUsersRaw = await User.find();
    const allUsers = allUsersRaw.map((u) => ({
      ...u._doc,
      role: (u.role || "").trim().toLowerCase()
    }));

    res.json({
      student: allUsers.filter((u) => u.role === "student"),
      professor: allUsers.filter((u) => u.role === "professor"),
      hod: allUsers.filter((u) => u.role === "hod"),
      counts: {
        student: allUsers.filter((u) => u.role === "student").length,
        professor: allUsers.filter((u) => u.role === "professor").length,
        hod: allUsers.filter((u) => u.role === "hod").length
      }
    });
  } catch {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/* ================= GET PENDING USERS ================= */

router.get("/pending", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.find();
    res.json(pending);
  } catch {
    res.status(500).json({ message: "Error fetching pending users" });
  }
});

/* ================= APPROVE USER ================= */

router.post("/approve/:id", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: "User not found" });

    const newUser = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      department: pending.department
    });

    await newUser.save();
    await PendingUser.findByIdAndDelete(req.params.id);

    await sendMail({
      to: pending.email,
      subject: "Your account has been approved",
      text: `Hello ${pending.name},

Your account is approved. You may now log in.

- University Admin`
    });

    res.json({ message: "User approved successfully!" });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Approval failed" });
  }
});

/* ================= REJECT USER ================= */

router.delete("/reject/:id", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: "User not found" });

    await sendMail({
      to: pending.email,
      subject: "Signup Request Rejected",
      text: `Hello ${pending.name},

Your signup request was rejected.

- University Admin`
    });

    await PendingUser.findByIdAndDelete(req.params.id);

    res.json({ message: "User rejected" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Rejection failed" });
  }
});

/* ================= DELETE USER ================= */

router.delete("/delete/:id", auth, isAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) return res.status(404).json({ message: "User not found" });

    await Assignment.deleteMany({ studentId: req.params.id });

    const files = await req.app.locals.bucket
      .find({
        $or: [
          { "metadata.email": (userToDelete.email || "").toLowerCase() },
          { "metadata.username": (userToDelete.email || "").toLowerCase() }
        ]
      })
      .toArray();

    for (const f of files) {
      await req.app.locals.bucket.delete(f._id);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and all associated data deleted successfully!" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ================= CREATE FACULTY ================= */

router.post("/create-faculty", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || !email || !password || !department || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role !== "professor" && role !== "hod") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department
    });

    await user.save();

    // Email should NOT block user creation
    try {
      await sendMail({
        to: email,
        subject: "Faculty Account Created",
        text: `Hello ${name},

Your faculty account has been created by the admin.

Login credentials:
Email: ${email}
Password: ${password}
Role: ${role}

Please login and change your password after first login.

- University Admin`
      });
    } catch (mailErr) {
      console.error("FACULTY MAIL FAILED:", mailErr);
    }

    return res.json({ message: "Faculty created successfully" });
  } catch (err) {
    console.error("CREATE FACULTY ERROR:", err);
    return res.status(500).json({ message: "Failed to create faculty" });
  }
});

export default router;
