import "./styles.css";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import baseQuestions from "./data/baseQuestions.json";
import areas from "./data/areas.json";
import { appSettings, firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

const state = {
  user: null,
  meta: null,
  questions: [],
  session: [],
  currentIndex: 0,
  answers: {},
  startedAt: null,
  timer: null
};

const els = {
  authScreen: document.querySelector("#authScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  registerForm: document.querySelector("#registerForm"),
  registerName: document.querySelector("#registerName"),
  registerUsername: document.querySelector("#registerUsername"),
  registerPassword: document.querySelector("#registerPassword"),
  registerRole: document.querySelector("#registerRole"),
  registerMessage: document.querySelector("#registerMessage"),
  connectionBadge: document.querySelector("#connectionBadge"),
  totalQuestions: document.querySelector("#totalQuestions"),
  sessionClock: document.querySelector("#sessionClock"),
  userBadge: document.querySelector("#userBadge"),
  themeToggle: document.querySelector("#themeToggle"),
  logoutBtn: document.querySelector("#logoutBtn"),
  areaSelect: document.querySelector("#areaSelect"),
  amountSelect: document.querySelector("#amountSelect"),
  difficultySelect: document.querySelector("#difficultySelect"),
  startBtn: document.querySelector("#startBtn"),
  resetStats: document.querySelector("#resetStats"),
  teacherPanel: document.querySelector("#teacherPanel"),
  adminPanel: document.querySelector("#adminPanel"),
  openQuestionFormBtn: document.querySelector("#openQuestionFormBtn"),
  adminQuestionFormBtn: document.querySelector("#adminQuestionFormBtn"),
  openAdminBtn: document.querySelector("#openAdminBtn"),
  areaList: document.querySelector("#areaList"),
  bestScore: document.querySelector("#bestScore"),
  practiceCount: document.querySelector("#practiceCount"),
  emptyState: document.querySelector("#emptyState"),
  quizView: document.querySelector("#quizView"),
  resultsView: document.querySelector("#resultsView"),
  managerView: document.querySelector("#managerView"),
  adminView: document.querySelector("#adminView"),
  questionArea: document.querySelector("#questionArea"),
  questionCounter: document.querySelector("#questionCounter"),
  questionDifficulty: document.querySelector("#questionDifficulty"),
  progressFill: document.querySelector("#progressFill"),
  questionContext: document.querySelector("#questionContext"),
  questionSkill: document.querySelector("#questionSkill"),
  questionPrompt: document.querySelector("#questionPrompt"),
  optionsList: document.querySelector("#optionsList"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  finishBtn: document.querySelector("#finishBtn"),
  scoreTitle: document.querySelector("#scoreTitle"),
  scorePercent: document.querySelector("#scorePercent"),
  resultBars: document.querySelector("#resultBars"),
  reviewList: document.querySelector("#reviewList"),
  newSessionBtn: document.querySelector("#newSessionBtn"),
  backHomeFromManager: document.querySelector("#backHomeFromManager"),
  questionForm: document.querySelector("#questionForm"),
  questionAreaSelect: document.querySelector("#questionAreaSelect"),
  questionDifficultySelect: document.querySelector("#questionDifficultySelect"),
  questionSkillInput: document.querySelector("#questionSkillInput"),
  questionContextInput: document.querySelector("#questionContextInput"),
  questionPromptInput: document.querySelector("#questionPromptInput"),
  correctAnswerSelect: document.querySelector("#correctAnswerSelect"),
  questionExplanationInput: document.querySelector("#questionExplanationInput"),
  questionFormMessage: document.querySelector("#questionFormMessage"),
  backHomeFromAdmin: document.querySelector("#backHomeFromAdmin"),
  teacherList: document.querySelector("#teacherList")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

function emailForUsername(username) {
  return `${normalizeUsername(username)}@${appSettings.usernameEmailDomain}`;
}

function areaName(areaId) {
  return areas.find((area) => area.id === areaId)?.name || areaId;
}

function buildMeta(questions) {
  return {
    sourceNote: "Banco original de practica inspirado en competencias Saber 11. No corresponde a preguntas oficiales del ICFES.",
    areas: areas.map((area) => ({
      ...area,
      count: questions.filter((question) => question.areaId === area.id).length
    })),
    total: questions.length
  };
}

function publicQuestion(input, author) {
  return {
    areaId: input.areaId,
    area: areaName(input.areaId),
    skill: String(input.skill || "Pregunta creada por profesor").trim(),
    difficulty: input.difficulty || "Medio",
    context: String(input.context || "").trim(),
    prompt: String(input.prompt || "").trim(),
    options: input.options.map((option) => String(option || "").trim()),
    answer: Number(input.answer),
    explanation: String(input.explanation || "Revisa el concepto trabajado en la pregunta.").trim(),
    source: "teacher",
    authorId: author.id,
    authorName: author.fullName || author.username
  };
}

function validateQuestion(question) {
  if (!areas.some((area) => area.id === question.areaId)) {
    throw new Error("Selecciona una materia valida.");
  }
  if (question.prompt.length < 8) {
    throw new Error("La pregunta es demasiado corta.");
  }
  if (question.options.length !== 4 || question.options.some((option) => !option)) {
    throw new Error("Debes escribir las cuatro opciones.");
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
    throw new Error("Selecciona la respuesta correcta.");
  }
}

function makeLocalProvider() {
  const storeKey = "icfesLocalStore";
  const userKey = "icfesLocalUser";
  let currentUser = JSON.parse(localStorage.getItem(userKey) || "null");

  function defaultStore() {
    return {
      users: [{
        id: "local-admin",
        username: appSettings.localAdmin.username,
        fullName: appSettings.localAdmin.fullName,
        password: appSettings.localAdmin.password,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }],
      customQuestions: [],
      results: []
    };
  }

  function readStore() {
    const store = JSON.parse(localStorage.getItem(storeKey) || "null") || defaultStore();
    const hasAdmin = store.users.some((user) => user.role === "admin");
    if (!hasAdmin) {
      store.users.push(defaultStore().users[0]);
      writeStore(store);
    }
    return store;
  }

  function writeStore(store) {
    localStorage.setItem(storeKey, JSON.stringify(store));
  }

  function safeUser(user) {
    if (!user) {
      return null;
    }
    const { password, ...rest } = user;
    return rest;
  }

  return {
    mode: "local",
    async init() {
      return currentUser;
    },
    async login(username, password) {
      const store = readStore();
      const key = normalizeUsername(username);
      const user = store.users.find((item) => normalizeUsername(item.username) === key);
      if (!user || user.password !== password) {
        throw new Error("Usuario o contrasena incorrectos.");
      }
      if (user.status !== "active") {
        throw new Error("Tu cuenta aun esta pendiente de aprobacion.");
      }
      currentUser = safeUser(user);
      localStorage.setItem(userKey, JSON.stringify(currentUser));
      return currentUser;
    },
    async register({ fullName, username, password, role }) {
      const store = readStore();
      const key = normalizeUsername(username);
      if (key.length < 3) {
        throw new Error("El usuario debe tener al menos 3 caracteres.");
      }
      if (String(password || "").length < 4) {
        throw new Error("La contrasena debe tener al menos 4 caracteres.");
      }
      if (store.users.some((user) => normalizeUsername(user.username) === key)) {
        throw new Error("Ese usuario ya existe.");
      }
      const user = {
        id: `local-${Date.now()}`,
        username: key,
        fullName: String(fullName || key).trim(),
        password,
        role: role === "teacher" ? "teacher" : "student",
        status: role === "teacher" ? "pending" : "active",
        createdAt: new Date().toISOString(),
        approvedAt: role === "teacher" ? null : new Date().toISOString()
      };
      store.users.push(user);
      writeStore(store);
      if (user.status !== "active") {
        return safeUser(user);
      }
      currentUser = safeUser(user);
      localStorage.setItem(userKey, JSON.stringify(currentUser));
      return currentUser;
    },
    async logout() {
      currentUser = null;
      localStorage.removeItem(userKey);
    },
    async loadQuestions() {
      const store = readStore();
      const questions = [...baseQuestions, ...store.customQuestions];
      return { questions, meta: buildMeta(questions) };
    },
    async addQuestion(input) {
      if (!["teacher", "admin"].includes(currentUser?.role)) {
        throw new Error("Solo profesores aprobados o admin pueden crear preguntas.");
      }
      const store = readStore();
      const question = {
        id: `local-question-${Date.now()}`,
        ...publicQuestion(input, currentUser),
        createdAt: new Date().toISOString()
      };
      validateQuestion(question);
      store.customQuestions.push(question);
      writeStore(store);
      return question;
    },
    async pendingTeachers() {
      return readStore().users
        .filter((user) => user.role === "teacher" && user.status === "pending")
        .map(safeUser);
    },
    async approveTeacher(id) {
      if (currentUser?.role !== "admin") {
        throw new Error("Solo el admin puede aprobar profesores.");
      }
      const store = readStore();
      const teacher = store.users.find((user) => user.id === id && user.role === "teacher");
      if (!teacher) {
        throw new Error("Profesor no encontrado.");
      }
      teacher.status = "active";
      teacher.approvedAt = new Date().toISOString();
      writeStore(store);
      return safeUser(teacher);
    },
    async saveResult(result) {
      const store = readStore();
      store.results.push({ id: `local-result-${Date.now()}`, ...result });
      writeStore(store);
    }
  };
}

async function makeFirebaseProvider() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await setPersistence(auth, indexedDBLocalPersistence).catch(() => null);

  let db;
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    db = getFirestore(app);
  }

  let currentUser = null;

  function waitForAuth() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  function safeUserFromSnap(snap) {
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...snap.data() };
  }

  async function loadUser(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return safeUserFromSnap(snap);
  }

  return {
    mode: "firebase",
    async init() {
      const authUser = await waitForAuth();
      if (!authUser) {
        return null;
      }
      currentUser = await loadUser(authUser.uid);
      if (currentUser?.status !== "active") {
        await signOut(auth);
        currentUser = null;
        return null;
      }
      return currentUser;
    },
    async login(username, password) {
      const credentials = await signInWithEmailAndPassword(auth, emailForUsername(username), password);
      const user = await loadUser(credentials.user.uid);
      if (!user) {
        await signOut(auth);
        throw new Error("El perfil no existe en Firestore. Crea o siembra el usuario.");
      }
      if (user.status !== "active") {
        await signOut(auth);
        throw new Error("Tu cuenta aun esta pendiente de aprobacion.");
      }
      currentUser = user;
      return currentUser;
    },
    async register({ fullName, username, password, role }) {
      const cleanUsername = normalizeUsername(username);
      const cleanRole = role === "teacher" ? "teacher" : "student";
      if (cleanUsername.length < 3) {
        throw new Error("El usuario debe tener al menos 3 caracteres.");
      }
      const credentials = await createUserWithEmailAndPassword(auth, emailForUsername(cleanUsername), password);
      const user = {
        id: credentials.user.uid,
        username: cleanUsername,
        usernameKey: cleanUsername,
        fullName: String(fullName || cleanUsername).trim(),
        role: cleanRole,
        status: cleanRole === "teacher" ? "pending" : "active",
        createdAt: serverTimestamp(),
        approvedAt: cleanRole === "teacher" ? null : serverTimestamp()
      };
      await setDoc(doc(db, "users", credentials.user.uid), user);
      const plainUser = { ...user, createdAt: new Date().toISOString(), approvedAt: user.approvedAt ? new Date().toISOString() : null };
      if (plainUser.status !== "active") {
        await signOut(auth);
        return plainUser;
      }
      currentUser = plainUser;
      return currentUser;
    },
    async logout() {
      currentUser = null;
      await signOut(auth);
    },
    async loadQuestions() {
      let custom = [];
      try {
        const snap = await getDocs(collection(db, "questions"));
        custom = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      } catch {
        custom = [];
      }
      const questions = [...baseQuestions, ...custom];
      return { questions, meta: buildMeta(questions) };
    },
    async addQuestion(input) {
      if (!["teacher", "admin"].includes(currentUser?.role)) {
        throw new Error("Solo profesores aprobados o admin pueden crear preguntas.");
      }
      const question = {
        ...publicQuestion(input, currentUser),
        createdAt: serverTimestamp()
      };
      validateQuestion(question);
      const ref = await addDoc(collection(db, "questions"), question);
      return { id: ref.id, ...question };
    },
    async pendingTeachers() {
      if (currentUser?.role !== "admin") {
        throw new Error("Solo el admin puede ver profesores pendientes.");
      }
      const teachersQuery = query(
        collection(db, "users"),
        where("role", "==", "teacher"),
        where("status", "==", "pending")
      );
      const snap = await getDocs(teachersQuery);
      return snap.docs.map(safeUserFromSnap);
    },
    async approveTeacher(id) {
      if (currentUser?.role !== "admin") {
        throw new Error("Solo el admin puede aprobar profesores.");
      }
      await updateDoc(doc(db, "users", id), {
        status: "active",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.id
      });
    },
    async saveResult(result) {
      if (!currentUser?.id) {
        return;
      }
      await addDoc(collection(db, "results"), {
        ...result,
        userId: currentUser.id,
        createdAt: serverTimestamp()
      });
    }
  };
}

const dataProvider = hasFirebaseConfig()
  ? await makeFirebaseProvider()
  : makeLocalProvider();

function setMessage(element, message, type = "") {
  element.textContent = message || "";
  element.className = `form-message ${type}`.trim();
}

function statsKey() {
  return `icfesStats:${dataProvider.mode}:${state.user?.id || "anon"}`;
}

function getStats() {
  const fallback = { sessions: 0, best: 0 };
  try {
    return JSON.parse(localStorage.getItem(statsKey())) || fallback;
  } catch {
    return fallback;
  }
}

function saveStats(score) {
  const stats = getStats();
  stats.sessions += 1;
  stats.best = Math.max(stats.best, score);
  localStorage.setItem(statsKey(), JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const stats = getStats();
  els.bestScore.textContent = `${stats.best}%`;
  els.practiceCount.textContent = stats.sessions;
}

function renderConnection() {
  const mode = dataProvider.mode === "firebase" ? "Firebase" : "Local";
  const status = navigator.onLine ? "online" : "offline";
  els.connectionBadge.textContent = `${mode} · ${status}`;
}

function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startClock() {
  clearInterval(state.timer);
  state.startedAt = Date.now();
  els.sessionClock.textContent = "00:00";
  state.timer = setInterval(() => {
    els.sessionClock.textContent = formatTime(Date.now() - state.startedAt);
  }, 1000);
}

function stopClock() {
  clearInterval(state.timer);
  state.timer = null;
}

function showView(name) {
  els.emptyState.classList.toggle("hidden", name !== "empty");
  els.quizView.classList.toggle("hidden", name !== "quiz");
  els.resultsView.classList.toggle("hidden", name !== "results");
  els.managerView.classList.toggle("hidden", name !== "manager");
  els.adminView.classList.toggle("hidden", name !== "admin");
}

function applyStoredTheme() {
  const theme = localStorage.getItem("icfesTheme") || "light";
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent = theme === "dark" ? "Modo claro" : "Modo neon";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("icfesTheme", nextTheme);
  els.themeToggle.textContent = nextTheme === "dark" ? "Modo claro" : "Modo neon";
}

function renderRolePanels() {
  const isTeacher = state.user?.role === "teacher";
  const isAdmin = state.user?.role === "admin";
  els.teacherPanel.classList.toggle("hidden", !isTeacher && !isAdmin);
  els.adminPanel.classList.toggle("hidden", !isAdmin);
  const roleLabel = {
    admin: "Admin",
    teacher: "Profesor",
    student: "Estudiante"
  }[state.user?.role] || "Usuario";
  els.userBadge.textContent = `${state.user.fullName} · ${roleLabel}`;
}

function renderSetup() {
  const allAreas = [{ id: "todas", name: "Todas las areas", count: state.meta.total, accent: "#111827" }, ...state.meta.areas];

  els.totalQuestions.textContent = `${state.meta.total} preguntas`;
  els.areaSelect.innerHTML = allAreas
    .map((area) => `<option value="${escapeHtml(area.id)}">${escapeHtml(area.name)} (${area.count})</option>`)
    .join("");

  els.questionAreaSelect.innerHTML = state.meta.areas
    .map((area) => `<option value="${escapeHtml(area.id)}">${escapeHtml(area.name)}</option>`)
    .join("");

  els.areaList.innerHTML = state.meta.areas
    .map((area) => `
      <div class="area-row">
        <span class="area-dot" style="background:${escapeHtml(area.accent)}"></span>
        <strong>${escapeHtml(area.name)}</strong>
        <span>${area.count}</span>
      </div>
    `)
    .join("");
}

function selectedPool() {
  const area = els.areaSelect.value;
  const difficulty = els.difficultySelect.value;
  return state.questions.filter((question) => {
    const matchesArea = area === "todas" || question.areaId === area;
    const matchesDifficulty = difficulty === "todas" || question.difficulty === difficulty;
    return matchesArea && matchesDifficulty;
  });
}

function startSession() {
  const amount = Number(els.amountSelect.value);
  const pool = selectedPool();

  if (pool.length === 0) {
    alert("No hay preguntas con esa combinacion.");
    return;
  }

  state.session = shuffle(pool).slice(0, Math.min(amount, pool.length));
  state.currentIndex = 0;
  state.answers = {};
  startClock();
  showView("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.session[state.currentIndex];
  const selected = state.answers[question.id];
  const progress = ((state.currentIndex + 1) / state.session.length) * 100;

  els.questionArea.textContent = question.area;
  els.questionCounter.textContent = `Pregunta ${state.currentIndex + 1} de ${state.session.length}`;
  els.questionDifficulty.textContent = question.difficulty;
  els.progressFill.style.width = `${progress}%`;
  els.questionSkill.textContent = question.skill;
  els.questionPrompt.textContent = question.prompt;
  els.questionContext.textContent = question.context || "";
  els.questionContext.classList.toggle("hidden", !question.context);

  els.optionsList.innerHTML = question.options
    .map((option, index) => {
      const isSelected = selected === index;
      return `
        <button class="option ${isSelected ? "selected" : ""}" data-index="${index}">
          <span class="option-letter">${String.fromCharCode(65 + index)}</span>
          <span>${escapeHtml(option)}</span>
        </button>
      `;
    })
    .join("");

  els.prevBtn.disabled = state.currentIndex === 0;
  els.nextBtn.disabled = state.currentIndex === state.session.length - 1;
  els.finishBtn.textContent = state.session.every((item) => state.answers[item.id] !== undefined)
    ? "Finalizar"
    : "Finalizar incompleta";
}

function chooseAnswer(index) {
  const question = state.session[state.currentIndex];
  state.answers[question.id] = index;
  renderQuestion();
}

async function finishSession() {
  const correct = state.session.filter((question) => state.answers[question.id] === question.answer).length;
  const percent = Math.round((correct / state.session.length) * 100);
  stopClock();
  saveStats(percent);
  renderResults(correct, percent);
  showView("results");
  dataProvider.saveResult({
    total: state.session.length,
    correct,
    percent,
    answers: state.answers,
    finishedAt: new Date().toISOString()
  }).catch(() => null);
}

function renderResults(correct, percent) {
  els.scoreTitle.textContent = `${correct} de ${state.session.length} correctas`;
  els.scorePercent.textContent = `${percent}%`;

  const grouped = state.session.reduce((acc, question) => {
    if (!acc[question.area]) {
      acc[question.area] = { total: 0, correct: 0 };
    }
    acc[question.area].total += 1;
    if (state.answers[question.id] === question.answer) {
      acc[question.area].correct += 1;
    }
    return acc;
  }, {});

  els.resultBars.innerHTML = Object.entries(grouped)
    .map(([area, info]) => {
      const value = Math.round((info.correct / info.total) * 100);
      return `
        <div class="result-bar">
          <span>${escapeHtml(area)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${value}%"></div></div>
          <span>${value}%</span>
        </div>
      `;
    })
    .join("");

  els.reviewList.innerHTML = state.session
    .map((question, index) => {
      const selected = state.answers[question.id];
      const isCorrect = selected === question.answer;
      const userAnswer = selected === undefined ? "Sin responder" : question.options[selected];
      const correctAnswer = question.options[question.answer];
      return `
        <article class="review-item ${isCorrect ? "correct" : "incorrect"}">
          <h4>${index + 1}. ${escapeHtml(question.prompt)}</h4>
          <p><strong>Tu respuesta:</strong> ${escapeHtml(userAnswer)}</p>
          <p><strong>Respuesta correcta:</strong> ${escapeHtml(correctAnswer)}</p>
          <p><strong>Explicacion:</strong> ${escapeHtml(question.explanation)}</p>
        </article>
      `;
    })
    .join("");
}

async function loadQuestions() {
  const payload = await dataProvider.loadQuestions();
  state.meta = payload.meta;
  state.questions = payload.questions;
  renderSetup();
  renderStats();
}

async function enterApp(user) {
  state.user = user;
  els.authScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  renderRolePanels();
  renderConnection();
  await loadQuestions();
  showView("empty");
}

function leaveApp() {
  stopClock();
  state.user = null;
  state.questions = [];
  state.meta = null;
  state.session = [];
  state.answers = {};
  els.authScreen.classList.remove("hidden");
  els.appShell.classList.add("hidden");
  setMessage(els.loginMessage, "");
  setMessage(els.registerMessage, "");
}

async function login(event) {
  event.preventDefault();
  setMessage(els.loginMessage, "Entrando...");
  try {
    const user = await dataProvider.login(els.loginUsername.value, els.loginPassword.value);
    els.loginForm.reset();
    await enterApp(user);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

async function register(event) {
  event.preventDefault();
  setMessage(els.registerMessage, "Creando cuenta...");
  try {
    const user = await dataProvider.register({
      fullName: els.registerName.value,
      username: els.registerUsername.value,
      password: els.registerPassword.value,
      role: els.registerRole.value
    });

    els.registerForm.reset();
    if (user.status === "active") {
      await enterApp(user);
      return;
    }

    setMessage(els.registerMessage, "Profesor registrado. Espera aprobacion del admin.", "success");
  } catch (error) {
    setMessage(els.registerMessage, error.message, "error");
  }
}

function openQuestionManager() {
  stopClock();
  showView("manager");
  setMessage(els.questionFormMessage, "");
}

async function saveQuestion(event) {
  event.preventDefault();
  setMessage(els.questionFormMessage, "Guardando...");

  try {
    const payload = {
      areaId: els.questionAreaSelect.value,
      difficulty: els.questionDifficultySelect.value,
      skill: els.questionSkillInput.value,
      context: els.questionContextInput.value,
      prompt: els.questionPromptInput.value,
      options: [0, 1, 2, 3].map((index) => document.querySelector(`#option${index}`).value),
      answer: Number(els.correctAnswerSelect.value),
      explanation: els.questionExplanationInput.value
    };

    await dataProvider.addQuestion(payload);
    els.questionForm.reset();
    els.questionDifficultySelect.value = "Medio";
    els.correctAnswerSelect.value = "0";
    await loadQuestions();
    setMessage(els.questionFormMessage, "Pregunta guardada. Si estas offline, se sincronizara al volver internet.", "success");
  } catch (error) {
    setMessage(els.questionFormMessage, error.message, "error");
  }
}

async function openAdminView() {
  stopClock();
  showView("admin");
  await loadPendingTeachers();
}

async function loadPendingTeachers() {
  els.teacherList.innerHTML = "<p class=\"form-message\">Cargando profesores...</p>";
  try {
    const teachers = await dataProvider.pendingTeachers();
    if (!teachers.length) {
      els.teacherList.innerHTML = "<p class=\"form-message\">No hay profesores pendientes por aprobar.</p>";
      return;
    }

    els.teacherList.innerHTML = teachers
      .map((teacher) => `
        <article class="teacher-item">
          <div>
            <h3>${escapeHtml(teacher.fullName)}</h3>
            <p>@${escapeHtml(teacher.username)} · pendiente</p>
          </div>
          <button class="primary-button approve-btn" data-id="${escapeHtml(teacher.id)}">Aprobar</button>
        </article>
      `)
      .join("");
  } catch (error) {
    els.teacherList.innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`;
  }
}

async function approveTeacher(event) {
  const button = event.target.closest(".approve-btn");
  if (!button) {
    return;
  }

  button.disabled = true;
  button.textContent = "Aprobando...";
  try {
    await dataProvider.approveTeacher(button.dataset.id);
    await loadPendingTeachers();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Aprobar";
    alert(error.message);
  }
}

async function boot() {
  applyStoredTheme();
  renderConnection();

  const user = await dataProvider.init();
  if (!user) {
    els.authScreen.classList.remove("hidden");
    els.appShell.classList.add("hidden");
    return;
  }

  await enterApp(user);
}

els.loginForm.addEventListener("submit", login);
els.registerForm.addEventListener("submit", register);
els.themeToggle.addEventListener("click", toggleTheme);
els.logoutBtn.addEventListener("click", async () => {
  await dataProvider.logout().catch(() => null);
  leaveApp();
});
els.startBtn.addEventListener("click", startSession);
els.newSessionBtn.addEventListener("click", () => {
  stopClock();
  showView("empty");
  els.sessionClock.textContent = "00:00";
});
els.backHomeFromManager.addEventListener("click", () => showView("empty"));
els.backHomeFromAdmin.addEventListener("click", () => showView("empty"));
els.openQuestionFormBtn.addEventListener("click", openQuestionManager);
els.adminQuestionFormBtn.addEventListener("click", openQuestionManager);
els.openAdminBtn.addEventListener("click", openAdminView);
els.questionForm.addEventListener("submit", saveQuestion);
els.teacherList.addEventListener("click", approveTeacher);
els.prevBtn.addEventListener("click", () => {
  state.currentIndex = Math.max(0, state.currentIndex - 1);
  renderQuestion();
});
els.nextBtn.addEventListener("click", () => {
  state.currentIndex = Math.min(state.session.length - 1, state.currentIndex + 1);
  renderQuestion();
});
els.finishBtn.addEventListener("click", finishSession);
els.optionsList.addEventListener("click", (event) => {
  const option = event.target.closest(".option");
  if (!option) {
    return;
  }
  chooseAnswer(Number(option.dataset.index));
});
els.resetStats.addEventListener("click", () => {
  localStorage.removeItem(statsKey());
  renderStats();
});
window.addEventListener("online", renderConnection);
window.addEventListener("offline", renderConnection);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => null);
  });
}

boot().catch((error) => {
  setMessage(els.loginMessage, error.message, "error");
});
