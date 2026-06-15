const endpointMap = {
  full: {
    text: "/api/generate",
    upload: "/api/generate/upload",
    title: "Complete Study Material"
  },
  flashcards: {
    text: "/api/generate/flashcards",
    upload: "/api/generate/upload/flashcards",
    title: "Flashcards"
  },
  quiz: {
    text: "/api/generate/quiz",
    upload: "/api/generate/upload/quiz",
    title: "Quiz"
  },
  explain: {
    text: "/api/generate/explain",
    upload: "/api/generate/upload/explain",
    title: "Beginner Explanation"
  }
};

const state = {
  mode: "full",
  outputView: "rendered",
  lastOutput: ""
};

const els = {
  apiStatus: document.querySelector("#apiStatus"),
  clearButton: document.querySelector("#clearButton"),
  copyButton: document.querySelector("#copyButton"),
  downloadButton: document.querySelector("#downloadButton"),
  emptyState: document.querySelector("#emptyState"),
  fileInput: document.querySelector("#notesFile"),
  fileLabel: document.querySelector("#fileLabel"),
  generateButton: document.querySelector("#generateButton"),
  generateButtonText: document.querySelector("#generateButtonText"),
  modeTabs: document.querySelectorAll(".mode-tab"),
  notesInput: document.querySelector("#notesInput"),
  outputMeta: document.querySelector("#outputMeta"),
  outputTabs: document.querySelectorAll(".output-tab"),
  outputTitle: document.querySelector("#outputTitle"),
  rawOutput: document.querySelector("#rawOutput"),
  renderedOutput: document.querySelector("#renderedOutput"),
  toast: document.querySelector("#toast"),
  uploadZone: document.querySelector("#uploadZone")
};

let loadingTimer;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}

function setLoading(isLoading) {
  els.generateButton.disabled = isLoading;
  els.generateButton.classList.toggle("loading", isLoading);

  window.clearInterval(loadingTimer);

  if (!isLoading) {
    els.generateButtonText.textContent = "Generate";
    return;
  }

  const startedAt = Date.now();
  els.generateButtonText.textContent = "Generating 0s";
  loadingTimer = window.setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    els.generateButtonText.textContent = `Generating ${seconds}s`;
  }, 1000);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let listOpen = false;
  let orderedListOpen = false;

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }

    if (orderedListOpen) {
      html.push("</ol>");
      orderedListOpen = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed === "---") {
      closeList();
      html.push("<hr />");
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (orderedListOpen) {
        html.push("</ol>");
        orderedListOpen = false;
      }
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      if (!orderedListOpen) {
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return html.join("");
}

function normalizeOutput(data) {
  if (typeof data === "string") {
    return normalizeTextOutput(data);
  }

  return formatJsonStudyOutput(data);
}

function normalizeTextOutput(value) {
  const cleaned = value
    .replace(/^```(?:json|markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return formatJsonStudyOutput(JSON.parse(cleaned));
  } catch {
    return cleaned;
  }
}

function formatJsonStudyOutput(value) {
  if (Array.isArray(value)) {
    return [
      "# FLASHCARDS",
      "",
      ...value.flatMap((item, index) => [
        `## Card ${index + 1}`,
        "",
        `**Q:** ${item.question || item.Question || ""}`,
        "",
        `**A:** ${item.answer || item.Answer || ""}`,
        ""
      ])
    ].join("\n");
  }

  if (value && typeof value === "object") {
    const parts = [];

    if (Array.isArray(value.mcqs)) {
      parts.push("# MULTIPLE CHOICE QUESTIONS", "");
      value.mcqs.forEach((item, index) => {
        const options = item.options || {};
        parts.push(
          `## Question ${index + 1}`,
          "",
          item.question || "",
          "",
          `A. ${options.A || ""}`,
          `B. ${options.B || ""}`,
          `C. ${options.C || ""}`,
          `D. ${options.D || ""}`,
          "",
          `**Correct Answer:** ${item.correctAnswer || ""}`,
          "",
          `**Explanation:** ${item.explanation || ""}`,
          ""
        );
      });
    }

    if (Array.isArray(value.shortAnswerQuestions)) {
      parts.push("# SHORT ANSWER QUESTIONS", "");
      value.shortAnswerQuestions.forEach((item, index) => {
        parts.push(
          `## Question ${index + 1}`,
          "",
          `**Question:** ${item.question || ""}`,
          "",
          `**Answer:** ${item.answer || ""}`,
          ""
        );
      });
    }

    return parts.length ? parts.join("\n") : JSON.stringify(value, null, 2);
  }

  return String(value ?? "");
}

function updateOutput(output, metaText) {
  state.lastOutput = output;
  els.emptyState.classList.add("hidden");
  els.renderedOutput.innerHTML = markdownToHtml(output);
  els.rawOutput.textContent = output;
  els.outputTitle.textContent = endpointMap[state.mode].title;
  els.outputMeta.textContent = metaText;
  setOutputView(state.outputView);
}

function setOutputView(view) {
  state.outputView = view;
  els.outputTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.section === view);
  });

  const hasOutput = Boolean(state.lastOutput);
  els.renderedOutput.classList.toggle("hidden", !hasOutput || view !== "rendered");
  els.rawOutput.classList.toggle("hidden", !hasOutput || view !== "raw");
}

async function generateFromText(config) {
  const notes = els.notesInput.value.trim();

  if (!notes) {
    throw new Error("Paste notes or choose a file first.");
  }

  const response = await fetch(config.text, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ notes })
  });

  return parseResponse(response);
}

async function generateFromFile(config) {
  const file = els.fileInput.files[0];

  if (!file) {
    throw new Error("Paste notes or choose a file first.");
  }

  const formData = new FormData();
  formData.append("notesFile", file);

  const response = await fetch(config.upload, {
    method: "POST",
    body: formData
  });

  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {
      success: false,
      message: text || `Request failed with status ${response.status}.`
    };
  }

  if (!response.ok && payload.success !== false) {
    payload.success = false;
    payload.message = payload.message || `Request failed with status ${response.status}.`;
  }

  return payload;
}

async function handleGenerate() {
  const config = endpointMap[state.mode];
  const hasFile = Boolean(els.fileInput.files[0]);
  const hasText = Boolean(els.notesInput.value.trim());

  if (!hasFile && !hasText) {
    showToast("Add notes first.");
    return;
  }

  setLoading(true);

  try {
    const payload = hasFile ? await generateFromFile(config) : await generateFromText(config);

    if (!payload.success) {
      throw new Error(payload.message || "Request failed.");
    }

    const output = normalizeOutput(payload.data);
    const source = payload.fileName
      ? `${payload.fileName} · ${payload.extractedCharacters.toLocaleString()} characters`
      : `${els.notesInput.value.trim().length.toLocaleString()} characters`;

    updateOutput(output, source);
    showToast("Generated successfully.");
  } catch (error) {
    showToast(error.message);
  } finally {
    setLoading(false);
  }
}

async function checkApi() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    if (!data.status) {
      throw new Error("Offline");
    }

    els.apiStatus.classList.add("online");
    els.apiStatus.classList.remove("offline");
    els.apiStatus.lastChild.textContent = "API Online";
  } catch {
    els.apiStatus.classList.add("offline");
    els.apiStatus.classList.remove("online");
    els.apiStatus.lastChild.textContent = "API Offline";
  }
}

function clearAll() {
  els.notesInput.value = "";
  els.fileInput.value = "";
  els.fileLabel.textContent = "Choose file";
  state.lastOutput = "";
  els.renderedOutput.innerHTML = "";
  els.rawOutput.textContent = "";
  els.emptyState.classList.remove("hidden");
  els.renderedOutput.classList.add("hidden");
  els.rawOutput.classList.add("hidden");
  els.outputMeta.textContent = "Ready when you are";
}

async function downloadOutput() {
  if (!state.lastOutput) {
    showToast("Nothing to download yet.");
    return;
  }

  showToast("Preparing PDF...");

  const response = await fetch("/api/generate/export/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: endpointMap[state.mode].title,
      content: state.lastOutput
    })
  });

  if (!response.ok) {
    const payload = await parseResponse(response);
    throw new Error(payload.message || "PDF export failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `studygenie-${state.mode}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("PDF saved.");
}

async function copyOutput() {
  if (!state.lastOutput) {
    showToast("Nothing to copy yet.");
    return;
  }

  await navigator.clipboard.writeText(state.lastOutput);
  showToast("Copied.");
}

els.modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.mode = tab.dataset.mode;
    els.modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
  });
});

els.outputTabs.forEach((tab) => {
  tab.addEventListener("click", () => setOutputView(tab.dataset.section));
});

els.fileInput.addEventListener("change", () => {
  const file = els.fileInput.files[0];
  els.fileLabel.textContent = file ? file.name : "Choose file";
});

["dragenter", "dragover"].forEach((eventName) => {
  els.uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.uploadZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.uploadZone.classList.remove("dragover");
  });
});

els.uploadZone.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer.files;
  if (!file) {
    return;
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  els.fileInput.files = dataTransfer.files;
  els.fileLabel.textContent = file.name;
});

els.generateButton.addEventListener("click", handleGenerate);
els.clearButton.addEventListener("click", clearAll);
els.copyButton.addEventListener("click", copyOutput);
els.downloadButton.addEventListener("click", () => {
  downloadOutput().catch((error) => showToast(error.message));
});

checkApi();
