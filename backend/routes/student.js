import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import Assignment from "../models/assignment.js";
import User from "../models/user.js";
import auth from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const formatDate = (date) => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

router.post("/upload", auth, upload.single("assignment"), async (req, res) => {
  try {
    const stream = req.app.locals.bucket.openUploadStream(
      `${Date.now()}-${req.file.originalname}`,
      {
        metadata: { email: req.user.email, title: req.body.title }
      }
    );

    stream.end(req.file.buffer);

    stream.on("finish", async () => {
      const file = await mongoose.connection.db
        .collection("studentfiles.files")
        .findOne({}, { sort: { uploadDate: -1 } });

      const student = await User.findById(req.user.id);

      const now = new Date();

      const assignment = await Assignment.create({
        studentName: student.name,
        studentEmail: student.email,
        studentId: student._id.toString(),
        department: student.department,
        title: req.body.title,
        fileUrl: file._id.toString(),
        status: "pending",
        submittedAt: now,
        submittedAtFormatted: formatDate(now)
      });

      res.json(assignment);
    });

    stream.on("error", () => {
      res.status(500).json({ message: "File upload error" });
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all/:email", auth, async (req, res) => {
  try {
    const email = req.user.email;

    const assignments = await Assignment.find({ studentEmail: email }).lean();

    const result = await Promise.all(
      assignments.map(async (a) => {
        const fileDetails = await mongoose.connection.db
          .collection("studentfiles.files")
          .findOne({ _id: new mongoose.Types.ObjectId(a.fileUrl) });

        return {
          _id: a.fileUrl,
          filename: fileDetails?.filename || "File Not Found",
          uploadDate: fileDetails?.uploadDate || null,
          title: a.title,
          status: a.status,
          reviewerName: a.reviewerName || "N/A",
          submittedAt: a.submittedAt,
          submittedAtFormatted: a.submittedAtFormatted
        };
      })
    );

    result.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error fetching assignments" });
  }
});

router.get("/file/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await req.app.locals.bucket.find({ _id: fileId }).toArray();
    
    if (!files.length) return res.sendStatus(404);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=" + files[0].filename
    });

    req.app.locals.bucket.openDownloadStream(fileId).pipe(res);
  } catch {
    res.status(500).json({ message: "Error downloading file" });
  }
});

export default router;
