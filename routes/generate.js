import express from "express";
import multer from "multer";
import {
  generateExplanation,
  generateFlashcards,
  generateQuiz,
  generateStudyMaterial
} from "../services/aiService.js";
import { extractNotesFromFile } from "../services/fileService.js";
import { createStudyPdf } from "../services/pdfService.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function sendSuccess(res, data, extra = {}) {
  res.json({
    success: true,
    data,
    ...extra
  });
}

function uploadAndGenerate(generator) {
  return async (req, res, next) => {
    try {
      const notes = await extractNotesFromFile(req.file);
      const result = await generator(notes);

      sendSuccess(res, result, {
        fileName: req.file.originalname,
        extractedCharacters: notes.length
      });
    } catch (error) {
      next(error);
    }
  };
}

router.post("/", async (req, res, next) => {
  try {
    const result = await generateStudyMaterial(req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.post("/flashcards", async (req, res, next) => {
  try {
    const result = await generateFlashcards(req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.post("/quiz", async (req, res, next) => {
  try {
    const result = await generateQuiz(req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.post("/explain", async (req, res, next) => {
  try {
    const result = await generateExplanation(req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.single("notesFile"), uploadAndGenerate(generateStudyMaterial));
router.post(
  "/upload/flashcards",
  upload.single("notesFile"),
  uploadAndGenerate(generateFlashcards)
);
router.post("/upload/quiz", upload.single("notesFile"), uploadAndGenerate(generateQuiz));
router.post(
  "/upload/explain",
  upload.single("notesFile"),
  uploadAndGenerate(generateExplanation)
);

router.post("/export/pdf", async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!content || typeof content !== "string") {
      throw new Error("PDF content is required.");
    }

    const pdf = await createStudyPdf({ title, content });
    const safeTitle = String(title || "studygenie-notes")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle || "studygenie-notes"}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
