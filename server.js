import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import generateRouter from "./routes/generate.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    name: "StudyGenie API",
    status: "ok",
    endpoints: {
      fullStudyMaterial: "POST /api/generate",
      flashcards: "POST /api/generate/flashcards",
      quiz: "POST /api/generate/quiz",
      explanation: "POST /api/generate/explain",
      uploadAndGenerate: "POST /api/generate/upload"
    }
  });
});

app.use("/api/generate", generateRouter);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong."
  });
});

app.listen(port, () => {
  console.log(`StudyGenie API running on http://localhost:${port}`);
});
