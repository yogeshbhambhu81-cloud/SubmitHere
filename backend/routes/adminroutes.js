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



/* ================= SEND MAIL FUNCTION ================= */

const sendMail = async ({ to, subject, text }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "UniPortal",
          email: process.env.BREVO_SENDER,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_SMTP_KEY,
        },
      }
    );

    console.log("BREVO MAIL SENT:", response.data);
    return true;
  } catch (err) {
    console.error("BREVO MAIL ERROR:", err.response?.data || err.message);
    return false;
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
      counts: {
        student: allUsers.filter((u) => u.role === "student").length,
        professor: allUsers.filter((u) => u.role === "professor").length,
      }
    });
  } catch {
    res.status(500).json({ error: "Something went wrong" });
  }
});

/* ================= GET PENDING USERS ================= */

router.get("/pending", auth, isAdmin, async (req, res) => {
  try {
    const pending = await PendingUser.find({ isEmailVerified: true });
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
    if (!pending.isEmailVerified) return res.status(400).json({ message: "User email not verified" });

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

/* ================= APPROVE ALL USERS ================= */

router.post("/approve-all", auth, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ isEmailVerified: true });
    if (!pendingUsers.length) return res.status(400).json({ message: "No pending verified users" });

    const newUsersData = pendingUsers.map(p => ({
      name: p.name,
      email: p.email,
      password: p.password,
      role: p.role,
      department: p.department
    }));

    await User.insertMany(newUsersData);
    const ids = pendingUsers.map(p => p._id);
    await PendingUser.deleteMany({ _id: { $in: ids } });

    // Send emails asynchronously without blocking response too long
    Promise.all(pendingUsers.map(p => sendMail({
      to: p.email,
      subject: "Your account has been approved",
      text: `Hello ${p.name},\n\nYour account is approved. You may now log in.\n\n- University Admin`
    }))).catch(console.error);

    res.json({ message: `${pendingUsers.length} users approved successfully!` });
  } catch (err) {
    console.error("APPROVE ALL ERROR:", err);
    res.status(500).json({ message: "Approve all failed" });
  }
});

/* ================= REJECT ALL USERS ================= */

router.delete("/reject-all", auth, isAdmin, async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ isEmailVerified: true });
    if (!pendingUsers.length) return res.status(400).json({ message: "No pending verified users" });

    const ids = pendingUsers.map(p => p._id);
    await PendingUser.deleteMany({ _id: { $in: ids } });

    Promise.all(pendingUsers.map(p => sendMail({
      to: p.email,
      subject: "Signup Request Rejected",
      text: `Hello ${p.name},\n\nYour signup request was rejected.\n\n- University Admin`
    }))).catch(console.error);

    res.json({ message: `${pendingUsers.length} users rejected successfully!` });
  } catch (err) {
    console.error("REJECT ALL ERROR:", err);
    res.status(500).json({ message: "Reject all failed" });
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

    if (role !== "professor") {
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
