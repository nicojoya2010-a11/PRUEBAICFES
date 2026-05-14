const state = {
  token: localStorage.getItem("icfesToken") || "",
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

function setMessage(element, message, type = "") {
  element.textContent = message || "";
  element.className = `form-message ${type}`.trim();
}

async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Solicitud fallida.");
  }
  return payload;
}

function statsKey() {
  return `icfesStats:${state.user?.id || "anon"}`;
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

function finishSession() {
  const correct = state.session.filter((question) => state.answers[question.id] === question.answer).length;
  const percent = Math.round((correct / state.session.length) * 100);
  stopClock();
  saveStats(percent);
  renderResults(correct, percent);
  showView("results");
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
  const payload = await api("/api/questions");
  state.meta = payload.meta;
  state.questions = payload.questions;
  renderSetup();
  renderStats();
}

async function enterApp(user, token = state.token) {
  state.user = user;
  state.token = token;
  if (token) {
    localStorage.setItem("icfesToken", token);
  }
  els.authScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  renderRolePanels();
  await loadQuestions();
  showView("empty");
}

function leaveApp() {
  stopClock();
  state.user = null;
  state.token = "";
  state.questions = [];
  state.meta = null;
  state.session = [];
  state.answers = {};
  localStorage.removeItem("icfesToken");
  els.authScreen.classList.remove("hidden");
  els.appShell.classList.add("hidden");
  setMessage(els.loginMessage, "");
  setMessage(els.registerMessage, "");
}

async function login(event) {
  event.preventDefault();
  setMessage(els.loginMessage, "Entrando...");
  try {
    const payload = await api("/api/auth/login", {
      method: "POST",
      body: {
        username: els.loginUsername.value,
        password: els.loginPassword.value
      }
    });
    els.loginForm.reset();
    await enterApp(payload.user, payload.token);
  } catch (error) {
    setMessage(els.loginMessage, error.message, "error");
  }
}

async function register(event) {
  event.preventDefault();
  setMessage(els.registerMessage, "Creando cuenta...");
  try {
    const payload = await api("/api/auth/register", {
      method: "POST",
      body: {
        fullName: els.registerName.value,
        username: els.registerUsername.value,
        password: els.registerPassword.value,
        role: els.registerRole.value
      }
    });

    els.registerForm.reset();
    if (payload.token) {
      await enterApp(payload.user, payload.token);
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

    await api("/api/questions/custom", {
      method: "POST",
      body: payload
    });

    els.questionForm.reset();
    els.questionDifficultySelect.value = "Medio";
    els.correctAnswerSelect.value = "0";
    await loadQuestions();
    setMessage(els.questionFormMessage, "Pregunta guardada. Ya aparece para los estudiantes.", "success");
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
    const payload = await api("/api/admin/teachers");
    if (!payload.teachers.length) {
      els.teacherList.innerHTML = "<p class=\"form-message\">No hay profesores pendientes por aprobar.</p>";
      return;
    }

    els.teacherList.innerHTML = payload.teachers
      .map((teacher) => `
        <article class="teacher-item">
          <div>
            <h3>${escapeHtml(teacher.fullName)}</h3>
            <p>@${escapeHtml(teacher.username)} · creado ${escapeHtml(new Date(teacher.createdAt).toLocaleString())}</p>
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
    await api(`/api/admin/teachers/${encodeURIComponent(button.dataset.id)}/approve`, {
      method: "POST"
    });
    await loadPendingTeachers();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Aprobar";
    alert(error.message);
  }
}

async function boot() {
  applyStoredTheme();
  renderStats();

  if (!state.token) {
    els.authScreen.classList.remove("hidden");
    els.appShell.classList.add("hidden");
    return;
  }

  try {
    const payload = await api("/api/auth/me");
    await enterApp(payload.user, state.token);
  } catch {
    leaveApp();
  }
}

els.loginForm.addEventListener("submit", login);
els.registerForm.addEventListener("submit", register);
els.themeToggle.addEventListener("click", toggleTheme);
els.logoutBtn.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    // Local logout should still work if the server session expired.
  }
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

boot();
