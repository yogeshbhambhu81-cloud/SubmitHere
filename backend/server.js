import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authroutes.js";
import userRoutes from "./routes/adminroutes.js";
import studentRoutes from "./routes/student.js";
import professorRoutes from "./routes/professorRoutes.js";
import departmentRoutes from "./routes/departmentRoute.js";
import hodRoutes from "./routes/hod.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected to universityData"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

mongoose.connection.once("open", () => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "studentfiles",
  });

  app.locals.bucket = bucket;
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/professor", professorRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/hod", hodRoutes);

app.get("/", (req, res) => res.send("Backend working ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));