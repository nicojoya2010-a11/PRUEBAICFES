const fs = require("fs");
const path = require("path");
const { getQuestionBank, getAreaInfo } = require("../data/questions");

const outputDir = path.join(__dirname, "..", "src", "data");
const extraQuestionsPath = path.join(__dirname, "..", "data", "extraQuestions.json");
fs.mkdirSync(outputDir, { recursive: true });

const areas = getAreaInfo();

function readExtraQuestions() {
  if (!fs.existsSync(extraQuestionsPath)) {
    return [];
  }

  const raw = JSON.parse(fs.readFileSync(extraQuestionsPath, "utf8"));
  const entries = Array.isArray(raw) ? raw : raw.questions;

  if (!Array.isArray(entries)) {
    throw new Error("data/extraQuestions.json debe ser un arreglo o tener una propiedad questions.");
  }

  return entries.filter((question) => question && question.enabled !== false);
}

function normalizeDifficulty(value) {
  const clean = String(value || "Medio").trim().toLowerCase();
  if (clean === "basico" || clean === "básico") {
    return "Básico";
  }
  if (clean === "avanzado") {
    return "Avanzado";
  }
  return "Medio";
}

function normalizeAnswer(value) {
  if (Number.isInteger(value) && value >= 0 && value <= 3) {
    return value;
  }

  const letters = { a: 0, b: 1, c: 2, d: 3 };
  const key = String(value || "").trim().toLowerCase();
  if (Object.hasOwn(letters, key)) {
    return letters[key];
  }

  throw new Error("La respuesta debe ser 0, 1, 2, 3 o A, B, C, D.");
}

function makeId(question, area, index, usedIds) {
  let base = String(question.id || "").trim();
  if (!base) {
    base = `${area.short}-EXTRA-${String(index + 1).padStart(3, "0")}`;
  }

  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function normalizeExtraQuestion(question, index, usedIds) {
  const area = areas.find((item) => item.id === question.areaId);
  if (!area) {
    throw new Error(`Pregunta extra ${index + 1}: areaId invalido.`);
  }

  const options = Array.isArray(question.options)
    ? question.options.map((option) => String(option || "").trim())
    : [];

  if (options.length !== 4 || options.some((option) => !option)) {
    throw new Error(`Pregunta extra ${index + 1}: escribe exactamente 4 opciones.`);
  }

  const prompt = String(question.prompt || "").trim();
  if (prompt.length < 8) {
    throw new Error(`Pregunta extra ${index + 1}: la pregunta es demasiado corta.`);
  }

  return {
    id: makeId(question, area, index, usedIds),
    areaId: area.id,
    area: area.name,
    skill: String(question.skill || "Competencia general").trim(),
    difficulty: normalizeDifficulty(question.difficulty),
    context: String(question.context || "").trim(),
    prompt,
    options,
    answer: normalizeAnswer(question.answer),
    explanation: String(question.explanation || "Revisa el concepto trabajado en la pregunta.").trim(),
    source: "extra-local"
  };
}

const generatedQuestions = getQuestionBank();
const usedIds = new Set(generatedQuestions.map((question) => question.id));
const extraQuestions = readExtraQuestions().map((question, index) => (
  normalizeExtraQuestion(question, index, usedIds)
));
const questions = [...generatedQuestions, ...extraQuestions];

fs.writeFileSync(
  path.join(outputDir, "baseQuestions.json"),
  `${JSON.stringify(questions, null, 2)}\n`,
  "utf8"
);

fs.writeFileSync(
  path.join(outputDir, "areas.json"),
  `${JSON.stringify(areas, null, 2)}\n`,
  "utf8"
);

console.log(`Banco exportado para la app web: ${generatedQuestions.length} base + ${extraQuestions.length} extra.`);
