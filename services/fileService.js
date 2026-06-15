import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

export function validateUploadedFile(file) {
  if (!file) {
    throw new Error("A notes file is required.");
  }

  if (!supportedMimeTypes.has(file.mimetype)) {
    throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
  }
}

export async function extractNotesFromFile(file) {
  validateUploadedFile(file);

  if (file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  return file.buffer.toString("utf8");
}
