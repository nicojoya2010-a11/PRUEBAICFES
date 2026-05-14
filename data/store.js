const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getAreaInfo } = require("./questions");

const STORE_PATH = path.join(__dirname, "store.json");
const DEFAULT_ADMIN = {
  username: process.env.LOCAL_ADMIN_USERNAME || "LOCALADMIN",
  password: process.env.LOCAL_ADMIN_PASSWORD || "CHANGE_ME",
  fullName: process.env.LOCAL_ADMIN_NAME || "Administrador"
};

function now() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) {
    return false;
  }
  return hashPassword(password, salt) === storedHash;
}

function baseStore() {
  return {
    users: [],
    customQuestions: []
  };
}

function readStore() {
  if (!fs.existsSync(STORE_PATH)) {
    const initial = baseStore();
    initial.users.push({
      id: "admin-001",
      username: DEFAULT_ADMIN.username,
      fullName: DEFAULT_ADMIN.fullName,
      role: "admin",
      status: "active",
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
      createdAt: now(),
      approvedAt: now()
    });
    writeStore(initial);
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  const store = {
    ...baseStore(),
    ...parsed,
    users: Array.isArray(parsed.users) ? parsed.users : [],
    customQuestions: Array.isArray(parsed.customQuestions) ? parsed.customQuestions : []
  };

  const hasAdmin = store.users.some((user) => user.role === "admin");
  if (!hasAdmin) {
    store.users.push({
      id: "admin-001",
      username: DEFAULT_ADMIN.username,
      fullName: DEFAULT_ADMIN.fullName,
      role: "admin",
      status: "active",
      passwordHash: hashPassword(DEFAULT_ADMIN.password),
      createdAt: now(),
      approvedAt: now()
    });
    writeStore(store);
  }

  return store;
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    approvedAt: user.approvedAt || null
  };
}

function findUserByUsername(username) {
  const store = readStore();
  const normalized = String(username || "").trim().toLowerCase();
  return store.users.find((user) => user.username.toLowerCase() === normalized);
}

function createUser({ username, password, fullName, role }) {
  const cleanUsername = String(username || "").trim();
  const cleanFullName = String(fullName || "").trim();
  const cleanPassword = String(password || "");
  const cleanRole = role === "teacher" ? "teacher" : "student";

  if (cleanUsername.length < 3) {
    throw new Error("El usuario debe tener al menos 3 caracteres.");
  }
  if (cleanPassword.length < 4) {
    throw new Error("La contrasena debe tener al menos 4 caracteres.");
  }

  const store = readStore();
  const exists = store.users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    throw new Error("Ese usuario ya existe.");
  }

  const user = {
    id: makeId(cleanRole),
    username: cleanUsername,
    fullName: cleanFullName || cleanUsername,
    role: cleanRole,
    status: cleanRole === "teacher" ? "pending" : "active",
    passwordHash: hashPassword(cleanPassword),
    createdAt: now(),
    approvedAt: cleanRole === "teacher" ? null : now()
  };

  store.users.push(user);
  writeStore(store);
  return publicUser(user);
}

function authenticate(username, password) {
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Usuario o contrasena incorrectos.");
  }
  if (user.status !== "active") {
    throw new Error("Tu cuenta aun esta pendiente de aprobacion.");
  }
  return publicUser(user);
}

function pendingTeachers() {
  const store = readStore();
  return store.users
    .filter((user) => user.role === "teacher" && user.status === "pending")
    .map(publicUser);
}

function approveTeacher(teacherId, adminUser) {
  if (!adminUser || adminUser.role !== "admin") {
    throw new Error("Solo el admin puede aprobar profesores.");
  }

  const store = readStore();
  const teacher = store.users.find((user) => user.id === teacherId && user.role === "teacher");
  if (!teacher) {
    throw new Error("Profesor no encontrado.");
  }

  teacher.status = "active";
  teacher.approvedAt = now();
  teacher.approvedBy = adminUser.id;
  writeStore(store);
  return publicUser(teacher);
}

function areaName(areaId) {
  const area = getAreaInfo().find((item) => item.id === areaId);
  return area ? area.name : null;
}

function addCustomQuestion(payload, author) {
  if (!author || !["teacher", "admin"].includes(author.role)) {
    throw new Error("Solo profesores aprobados o admin pueden crear preguntas.");
  }

  const clean = {
    areaId: String(payload.areaId || "").trim(),
    skill: String(payload.skill || "").trim() || "Pregunta creada por profesor",
    difficulty: String(payload.difficulty || "Medio").trim(),
    context: String(payload.context || "").trim(),
    prompt: String(payload.prompt || "").trim(),
    options: Array.isArray(payload.options) ? payload.options.map((item) => String(item || "").trim()) : [],
    answer: Number(payload.answer),
    explanation: String(payload.explanation || "").trim() || "Revisa el concepto trabajado en la pregunta."
  };

  const resolvedArea = areaName(clean.areaId);
  if (!resolvedArea) {
    throw new Error("Selecciona una materia valida.");
  }
  if (clean.prompt.length < 8) {
    throw new Error("La pregunta es demasiado corta.");
  }
  if (clean.options.length !== 4 || clean.options.some((option) => option.length < 1)) {
    throw new Error("Debes escribir las cuatro opciones de respuesta.");
  }
  if (!Number.isInteger(clean.answer) || clean.answer < 0 || clean.answer > 3) {
    throw new Error("Selecciona la respuesta correcta.");
  }

  const store = readStore();
  const question = {
    id: makeId("PROF"),
    areaId: clean.areaId,
    area: resolvedArea,
    skill: clean.skill,
    difficulty: ["Basico", "Básico", "Medio", "Avanzado"].includes(clean.difficulty) ? clean.difficulty : "Medio",
    context: clean.context,
    prompt: clean.prompt,
    options: clean.options,
    answer: clean.answer,
    explanation: clean.explanation,
    source: "teacher",
    authorId: author.id,
    authorName: author.fullName || author.username,
    createdAt: now()
  };

  store.customQuestions.push(question);
  writeStore(store);
  return question;
}

function customQuestions() {
  return readStore().customQuestions;
}

module.exports = {
  DEFAULT_ADMIN,
  addCustomQuestion,
  approveTeacher,
  authenticate,
  createUser,
  customQuestions,
  pendingTeachers,
  publicUser
};
