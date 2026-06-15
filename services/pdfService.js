import PDFDocument from "pdfkit";

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^```(?:markdown|md|json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1");
}

export function createStudyPdf({ title = "StudyGenie Notes", content }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 54,
      info: {
        Title: title,
        Author: "StudyGenie"
      }
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fillColor("#155940")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(title, { lineGap: 4 });

    doc
      .moveDown(0.4)
      .strokeColor("#d8e1d7")
      .lineWidth(1)
      .moveTo(54, doc.y)
      .lineTo(541, doc.y)
      .stroke()
      .moveDown(0.8);

    const lines = normalizeMarkdown(content).split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        doc.moveDown(0.35);
        continue;
      }

      if (line === "---") {
        doc
          .moveDown(0.4)
          .strokeColor("#d8e1d7")
          .lineWidth(1)
          .moveTo(54, doc.y)
          .lineTo(541, doc.y)
          .stroke()
          .moveDown(0.6);
        continue;
      }

      if (line.startsWith("# ")) {
        doc
          .moveDown(0.5)
          .fillColor("#155940")
          .font("Helvetica-Bold")
          .fontSize(17)
          .text(stripInlineMarkdown(line.slice(2)), { lineGap: 4 });
        continue;
      }

      if (line.startsWith("## ")) {
        doc
          .moveDown(0.35)
          .fillColor("#17201b")
          .font("Helvetica-Bold")
          .fontSize(13)
          .text(stripInlineMarkdown(line.slice(3)), { lineGap: 3 });
        continue;
      }

      if (line.startsWith("### ")) {
        doc
          .fillColor("#17201b")
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(stripInlineMarkdown(line.slice(4)), { lineGap: 3 });
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        doc
          .fillColor("#2b3730")
          .font("Helvetica")
          .fontSize(11)
          .text(`• ${stripInlineMarkdown(line.replace(/^[-*]\s+/, ""))}`, {
            indent: 12,
            lineGap: 3
          });
        continue;
      }

      doc
        .fillColor("#2b3730")
        .font(line.startsWith("**") ? "Helvetica-Bold" : "Helvetica")
        .fontSize(11)
        .text(stripInlineMarkdown(line), { lineGap: 4 });
    }

    doc.end();
  });
}
