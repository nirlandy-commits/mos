export const MOS_IMPORT_SOURCES = Object.freeze({
  PDF: "pdf",
  IMAGE: "image",
  TEXT: "text",
  CSV: "csv",
});

export const MOS_IMPORT_ACCEPT = Object.freeze({
  [MOS_IMPORT_SOURCES.PDF]: [".pdf"],
  [MOS_IMPORT_SOURCES.IMAGE]: [".png", ".jpg", ".jpeg", ".webp"],
  [MOS_IMPORT_SOURCES.TEXT]: [".txt", ".md"],
  [MOS_IMPORT_SOURCES.CSV]: [".csv"],
});

const PLAN_DEFAULT_TIMES = Object.freeze({
  "café da manhã": "08:00",
  "cafe da manha": "08:00",
  almoço: "12:30",
  almoco: "12:30",
  lanche: "16:00",
  jantar: "20:00",
  ceia: "22:00",
  "pré-treino": "17:00",
  "pre-treino": "17:00",
  "pre treino": "17:00",
  "pós-treino": "19:00",
  "pos-treino": "19:00",
  "pos treino": "19:00",
});

const PLAN_MEAL_PATTERNS = [
  { label: "Café da manhã", test: /(café da manhã|cafe da manha|breakfast)/i },
  { label: "Almoço", test: /(almoço|almoco|lunch)/i },
  { label: "Lanche da tarde", test: /(lanche|snack)/i },
  { label: "Jantar", test: /(jantar|dinner)/i },
  { label: "Ceia", test: /(ceia)/i },
  { label: "Pré-treino", test: /(pré-treino|pre-treino|pre treino)/i },
  { label: "Pós-treino", test: /(pós-treino|pos-treino|pos treino)/i },
];

const TRAINING_PLAN_PATTERNS = [
  /^(treino\s*[a-z0-9]+)/i,
  /^(push|pull|legs|upper|lower|full body|bodybuilding|cardio|mobilidade)\b/i,
  /^(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)\b/i,
];

const PDF_WORKER_URL = "https://esm.sh/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
let pdfJsPromise = null;

export function createImportDescriptor(overrides = {}) {
  return {
    id: overrides.id || "",
    source: overrides.source || MOS_IMPORT_SOURCES.TEXT,
    fileName: overrides.fileName || "",
    mimeType: overrides.mimeType || "",
    status: overrides.status || "idle",
    createdAt: overrides.createdAt || "",
    payload: overrides.payload || null,
  };
}

function createSuccessResult({ source, fileName, preview, message, rawText }) {
  return {
    ok: true,
    status: "ready",
    source,
    fileName,
    message,
    preview,
    rawText,
  };
}

function createFailureResult({ source, fileName, status, message }) {
  return {
    ok: false,
    status,
    source,
    fileName,
    message,
  };
}

function normalizeLineBreaks(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeTimeToken(value = "") {
  const match = String(value || "")
    .toLowerCase()
    .match(/(\d{1,2})[:h](\d{2})/);
  if (!match) return "";
  return `${String(Number(match[1]) || 0).padStart(2, "0")}:${match[2]}`;
}

function pickMealName(line = "") {
  const match = PLAN_MEAL_PATTERNS.find((item) => item.test.test(line));
  return match?.label || "";
}

function getDefaultMealTime(label = "") {
  const normalized = String(label || "").toLowerCase();
  return PLAN_DEFAULT_TIMES[normalized] || "12:00";
}

function splitFoodParts(line = "") {
  return String(line || "")
    .split(/(?:,|;|•|·|\u2022| \/ )/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseFoodPart(value = "") {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return null;

  let quantity = "";
  let name = cleanValue;

  const parenthesesMatch = cleanValue.match(/\(([^)]+)\)\s*$/);
  if (parenthesesMatch) {
    quantity = parenthesesMatch[1].trim();
    name = cleanValue.replace(/\(([^)]+)\)\s*$/, "").trim();
  } else {
    const quantityMatch = cleanValue.match(
      /(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|un|und|fatia|fatias|fatia(s)?|colher(?:es)?|xícara(?:s)?|xicara(?:s)?|cápsula(?:s)?|capsula(?:s)?|ovo(?:s)?|prato(?:s)?|dose(?:s)?|scoop(?:s)?)(?!.*\d)/i,
    );
    if (quantityMatch) {
      quantity = `${quantityMatch[1]} ${quantityMatch[2]}`.replace(/\s+/g, " ").trim();
      name = cleanValue.replace(quantityMatch[0], "").replace(/[-–—:]+$/, "").trim();
    }
  }

  return {
    name: name || cleanValue,
    quantity: quantity || "1 porção",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    benefit: "Item importado para revisão no MOS!",
  };
}

function parsePlanHeader(line = "") {
  const name = pickMealName(line);
  const time = normalizeTimeToken(line);

  if (!name && !time) return null;

  const inlineRemainder = String(line || "")
    .replace(/\d{1,2}[:h]\d{2}/gi, "")
    .replace(/[-–—|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    name: name || "Refeição importada",
    time: time || getDefaultMealTime(name || "Refeição importada"),
    remainder: name && inlineRemainder.toLowerCase().includes(name.toLowerCase())
      ? inlineRemainder.replace(new RegExp(name, "i"), "").trim()
      : inlineRemainder,
  };
}

function parsePlanFromText(rawText = "") {
  const text = normalizeLineBreaks(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const meals = [];
  const warnings = [];
  let currentMeal = null;

  const pushCurrentMeal = () => {
    if (!currentMeal) return;
    if (!currentMeal.foods.length) {
      warnings.push(`A refeição "${currentMeal.name}" ficou sem itens identificados.`);
    }
    meals.push({
      ...currentMeal,
      description: currentMeal.foods.map((item) => item.name).join(", "),
    });
  };

  lines.forEach((line) => {
    const header = parsePlanHeader(line);
    if (header) {
      pushCurrentMeal();
      currentMeal = {
        name: header.name,
        title: header.name,
        time: header.time,
        foods: [],
      };

      if (header.remainder) {
        splitFoodParts(header.remainder).forEach((part) => {
          const food = parseFoodPart(part);
          if (food) currentMeal.foods.push(food);
        });
      }
      return;
    }

    if (!currentMeal) {
      currentMeal = {
        name: "Refeição importada",
        title: "Refeição importada",
        time: "12:00",
        foods: [],
      };
    }

    splitFoodParts(line).forEach((part) => {
      const food = parseFoodPart(part);
      if (food) currentMeal.foods.push(food);
    });
  });

  pushCurrentMeal();

  const filteredMeals = meals.filter((meal) => meal.foods.length || meal.name);
  if (!filteredMeals.length) {
    return createFailureResult({
      source: MOS_IMPORT_SOURCES.TEXT,
      status: "no-plan-match",
      message: "Não encontrei refeições claras nesse conteúdo. Tente colar o plano com horários, nomes de refeição e alimentos.",
    });
  }

  return createSuccessResult({
    source: MOS_IMPORT_SOURCES.TEXT,
    preview: {
      kind: "plan",
      meals: filteredMeals,
      warnings,
      summary: `${filteredMeals.length} refeição(ões) encontrada(s)`,
    },
    message: `Encontrei ${filteredMeals.length} refeição(ões) para organizar no plano.`,
    rawText: text,
  });
}

function parseExerciseLine(line = "", index = 0) {
  const source = String(line || "").trim();
  if (!source) return null;

  const setsMatch = source.match(/(\d+)\s*[x×]\s*(\d+(?:\s*[-a]\s*\d+)?)/i);
  const restMatch = source.match(/(\d+)\s*(s|seg|min)\b/i);
  const loadMatch = source.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);

  let name = source
    .replace(/^\d+\s*[\.\)-]\s*/, "")
    .replace(/(\d+)\s*[x×]\s*(\d+(?:\s*[-a]\s*\d+)?)/i, "")
    .replace(/(\d+)\s*(s|seg|min)\b/i, "")
    .replace(/(\d+(?:[.,]\d+)?)\s*kg\b/i, "")
    .replace(/[-–—]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) name = `Exercício ${index + 1}`;

  return {
    name,
    focus: "",
    sets: Number(setsMatch?.[1]) || 3,
    reps: (setsMatch?.[2] || "10-12").replace(/\s+/g, ""),
    targetReps: Number(String(setsMatch?.[2] || "12").match(/\d+/)?.[0]) || 12,
    restSeconds: restMatch
      ? Number(restMatch[1]) * (String(restMatch[2]).toLowerCase() === "min" ? 60 : 1)
      : 60,
    suggestedLoadKg: Number(String(loadMatch?.[1] || "0").replace(",", ".")) || 0,
    loadDelta: "",
  };
}

function isTrainingHeader(line = "") {
  return TRAINING_PLAN_PATTERNS.some((pattern) => pattern.test(line));
}

function parseTrainingHeader(line = "") {
  const cleanLine = String(line || "").replace(/[:\-–—]+$/, "").trim();
  if (!cleanLine) return "";
  return cleanLine.length > 40 ? cleanLine.slice(0, 40).trim() : cleanLine;
}

function parseTrainingFromText(rawText = "") {
  const text = normalizeLineBreaks(rawText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const plans = [];
  const warnings = [];
  let currentPlan = null;

  const pushCurrentPlan = () => {
    if (!currentPlan) return;
    if (!currentPlan.exercises.length) {
      warnings.push(`O bloco "${currentPlan.name}" ficou sem exercícios reconhecidos.`);
    }
    currentPlan.estimatedMinutes = Math.max(20, currentPlan.exercises.length * 8);
    plans.push(currentPlan);
  };

  lines.forEach((line) => {
    if (isTrainingHeader(line)) {
      pushCurrentPlan();
      currentPlan = {
        name: parseTrainingHeader(line),
        estimatedMinutes: 45,
        exercises: [],
      };
      return;
    }

    const exercise = parseExerciseLine(line, currentPlan?.exercises?.length || 0);
    if (!exercise) return;

    if (!currentPlan) {
      currentPlan = {
        name: "Treino importado",
        estimatedMinutes: 45,
        exercises: [],
      };
    }

    currentPlan.exercises.push(exercise);
  });

  pushCurrentPlan();

  const filteredPlans = plans.filter((plan) => plan.exercises.length);
  if (!filteredPlans.length) {
    return createFailureResult({
      source: MOS_IMPORT_SOURCES.TEXT,
      status: "no-training-match",
      message: "Não encontrei exercícios claros nesse conteúdo. Tente colar linhas como “Agachamento 4x10” ou blocos como “Treino A”.",
    });
  }

  return createSuccessResult({
    source: MOS_IMPORT_SOURCES.TEXT,
    preview: {
      kind: "training",
      plans: filteredPlans,
      warnings,
      summary: `${filteredPlans.length} treino(s) encontrado(s)`,
    },
    message: `Encontrei ${filteredPlans.length} treino(s) para organizar no MOS!.`,
    rawText: text,
  });
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("https://esm.sh/pdfjs-dist@4.6.82").then((module) => {
      module.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      return module;
    });
  }
  return pdfJsPromise;
}

async function readPdfText(file) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = (content.items || [])
      .map((item) => item.str || "")
      .join(" ")
      .replace(/[ ]+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n");
}

function detectSource(file, text = "") {
  if (file?.type === "application/pdf") return MOS_IMPORT_SOURCES.PDF;
  if (file?.type?.startsWith("image/")) return MOS_IMPORT_SOURCES.IMAGE;
  if (file?.name?.toLowerCase().endsWith(".csv")) return MOS_IMPORT_SOURCES.CSV;
  if (file) return MOS_IMPORT_SOURCES.TEXT;
  if (text?.trim()) return MOS_IMPORT_SOURCES.TEXT;
  return MOS_IMPORT_SOURCES.TEXT;
}

async function extractImportText({ file, text }) {
  const source = detectSource(file, text);

  if (text?.trim()) {
    return {
      ok: true,
      source,
      fileName: file?.name || "",
      text: normalizeLineBreaks(text),
    };
  }

  if (!file) {
    return createFailureResult({
      source,
      status: "empty",
      message: "Cole um texto ou envie um arquivo para o MOS! organizar.",
    });
  }

  if (source === MOS_IMPORT_SOURCES.IMAGE) {
    return createFailureResult({
      source,
      fileName: file.name || "",
      status: "unsupported-image",
      message: "Imagem ainda não está pronta nesta primeira versão. Hoje o MOS! funciona melhor com texto ou PDF com texto selecionável.",
    });
  }

  try {
    const extractedText =
      source === MOS_IMPORT_SOURCES.PDF
        ? await readPdfText(file)
        : normalizeLineBreaks(await file.text());

    if (!extractedText.trim()) {
      return createFailureResult({
        source,
        fileName: file.name || "",
        status: "empty-file",
        message: "Esse arquivo veio vazio ou sem texto legível para o MOS! organizar.",
      });
    }

    return {
      ok: true,
      source,
      fileName: file.name || "",
      text: extractedText,
    };
  } catch (error) {
    return createFailureResult({
      source,
      fileName: file.name || "",
      status: "extract-failed",
      message: source === MOS_IMPORT_SOURCES.PDF
        ? "Não consegui ler esse PDF agora. Se puder, cole o texto direto ou use um PDF com texto selecionável."
        : "Não consegui ler esse arquivo agora.",
      error,
    });
  }
}

export function createMosImportService() {
  return {
    acceptMap: MOS_IMPORT_ACCEPT,
    describe(file = {}) {
      return createImportDescriptor({
        fileName: file.name || "",
        mimeType: file.type || "",
      });
    },
    async ingest({ target = "", file = null, text = "" } = {}) {
      const extracted = await extractImportText({ file, text });
      if (!extracted.ok) return extracted;

      const parserResult =
        target === "training"
          ? parseTrainingFromText(extracted.text)
          : parsePlanFromText(extracted.text);

      if (!parserResult.ok) {
        return {
          ...parserResult,
          source: extracted.source,
          fileName: extracted.fileName,
        };
      }

      return {
        ...parserResult,
        source: extracted.source,
        fileName: extracted.fileName,
      };
    },
  };
}
