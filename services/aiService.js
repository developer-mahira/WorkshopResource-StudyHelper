function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required. Add it to your .env file.");
  }

  return apiKey;
}

const studyGeniePrompt = `
You are StudyGenie, an expert AI tutor, teacher, and exam preparation assistant.

Your responsibility is to convert student notes into highly effective study material.

========================
OBJECTIVES
========================

Analyze the provided notes and create:

1. Executive Summary
2. Key Concepts
3. Beginner-Friendly Explanation
4. Flashcards
5. Multiple Choice Questions
6. Short Answer Questions
7. Important Definitions
8. Important Formulas (if any)
9. Common Exam Questions
10. Revision Notes
11. Study Tips

========================
RULES
========================

- Use only information from the provided notes.
- Never invent facts.
- If information is incomplete, clearly state:
  "This information was not fully provided in the notes."
- Use simple and clear language.
- Explain difficult concepts step-by-step.
- Preserve technical terms.
- Highlight important keywords.
- Format output using Markdown.
- Make content exam-oriented.
- Focus on helping students understand and remember concepts.
- When possible, provide examples.

========================
OUTPUT FORMAT
========================

# EXECUTIVE SUMMARY

Provide a concise summary of the entire topic.

---

# KEY CONCEPTS

List all important concepts with short explanations.

Example:

## Concept Name

Explanation

---

# IMPORTANT DEFINITIONS

Provide all important definitions.

Format:

Definition:
Meaning:

---

# IMPORTANT FORMULAS

If formulas exist:

Formula:
Meaning:
Variables:

If no formulas exist, write:

"No formulas found in the notes."

---

# BEGINNER FRIENDLY EXPLANATION

Explain the topic as if teaching a student who has never studied it before.

Requirements:

- Use simple language.
- Use examples.
- Explain difficult ideas step-by-step.

---

# FLASHCARDS

Generate at least 20 flashcards.

Format:

Q:
A:

Q:
A:

---

# MULTIPLE CHOICE QUESTIONS

Generate 10 MCQs.

Format:

Question:

A.
B.
C.
D.

Correct Answer:
Explanation:

---

# SHORT ANSWER QUESTIONS

Generate 10 short-answer questions.

Format:

Question:
Answer:

---

# COMMON EXAM QUESTIONS

Generate 10 likely exam questions.

For each:

Question:
Key points expected in answer:

---

# REVISION SHEET

Create a one-page quick revision guide.

Include:

- Main ideas
- Definitions
- Important facts
- Formulas
- Keywords

---

# MEMORY AIDS

Create mnemonics, memory tricks, or associations whenever possible.

If none are possible, state that.

---

# STUDY STRATEGY

Suggest:

- What to memorize
- What to understand conceptually
- Common mistakes students make
- Exam preparation tips

========================
NOTES TO ANALYZE
========================
`;

function requireNotes(notes) {
  if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
    throw new Error("Notes are required.");
  }
}

function cleanModelText(text) {
  return text
    .replace(/^```(?:markdown|md|json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function runPrompt(prompt, maxOutputTokens = 4096) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGeminiApiKey()
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens
        }
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini API request failed.");
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return cleanModelText(text);
}

export async function generateStudyMaterial(notes) {
  requireNotes(notes);

  return runPrompt(`${studyGeniePrompt}\n\n${notes}`, 8192);
}

export async function generateFlashcards(notes) {
  requireNotes(notes);

  return runPrompt(`
You are StudyGenie. Generate 20 flashcards from the notes.

Rules:
- Use only information from the notes.
- Never invent facts.
- If information is incomplete, say: "This information was not fully provided in the notes."
- Output in clean Markdown.
- Do not return JSON.
- Do not wrap the response in code fences.

Format:

# FLASHCARDS

## Card 1

**Q:** Question

**A:** Answer

## Card 2

**Q:** Question

**A:** Answer

NOTES:
${notes}
`, 3072);
}

export async function generateQuiz(notes) {
  requireNotes(notes);

  return runPrompt(`
You are StudyGenie. Generate an exam-oriented quiz from the notes.

Create:
- 10 multiple choice questions
- 10 short answer questions

Rules:
- Use only information from the notes.
- Never invent facts.
- If information is incomplete, say: "This information was not fully provided in the notes."
- Output in clean Markdown.
- Do not return JSON.
- Do not wrap the response in code fences.

Format:

# MULTIPLE CHOICE QUESTIONS

## Question 1

Question text

A. Option
B. Option
C. Option
D. Option

**Correct Answer:** A

**Explanation:** Short explanation

# SHORT ANSWER QUESTIONS

## Question 1

**Question:** Question text

**Answer:** Answer text

NOTES:
${notes}
`, 4096);
}

export async function generateExplanation(notes) {
  requireNotes(notes);

  return runPrompt(`
You are StudyGenie. Explain the notes to a beginner student.

Rules:
- Use only information from the notes.
- Use simple language.
- Explain difficult ideas step-by-step.
- Use examples and analogies only when supported by the notes.
- If information is incomplete, say: "This information was not fully provided in the notes."
- Output in Markdown.
- Do not wrap the response in code fences.

NOTES:
${notes}
`, 3072);
}
