# StudyGenie API

StudyGenie is a Node.js + Express app that turns student notes into exam-ready study material using the Gemini API.

## Features

- Accept raw text notes through JSON.
- Accept uploaded PDF, DOCX, and TXT notes.
- Generate a complete Markdown study guide.
- Generate separate flashcards, quizzes, and beginner explanations for frontend tabs.
- Includes a complete browser UI served by Express.

## Setup

```bash
npm install
cp .env.example .env
```

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=5000
```

Start the server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:5000
```

## Endpoints

### Full Study Material

```http
POST /api/generate
Content-Type: application/json
```

```json
{
  "notes": "Your notes here"
}
```

### Flashcards

```http
POST /api/generate/flashcards
Content-Type: application/json
```

```json
{
  "notes": "Your notes here"
}
```

### Quiz

```http
POST /api/generate/quiz
Content-Type: application/json
```

```json
{
  "notes": "Your notes here"
}
```

### Beginner Explanation

```http
POST /api/generate/explain
Content-Type: application/json
```

```json
{
  "notes": "Your notes here"
}
```

### Upload and Generate

```http
POST /api/generate/upload
Content-Type: multipart/form-data
```

Form field:

```text
notesFile
```

Supported file types:

- PDF
- DOCX
- TXT

Upload variants:

```text
POST /api/generate/upload/flashcards
POST /api/generate/upload/quiz
POST /api/generate/upload/explain
```

Health check:

```text
GET /api/health
```
