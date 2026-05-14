const http = require("http");
const fs = require("fs");
const path = require("path");
const { getAreaInfo, getQuestionBank } = require("./data/questions");
const {
  addCustomQuestion,
  approveTeacher,
  authenticate,
  createUser,
  customQuestions,
  pendingTeachers,
  publicUser
} = require("./data/store");

const PORT = Number(process.env.PORT || 1234);
const PUBLIC_DIR = path.join(__dirname, "public");
const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("La solicitud es demasiado grande."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

function makeToken(user) {
  const token = require("crypto").randomBytes(32).toString("hex");
  sessions.set(token, {
    user,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8
  });
  return token;
}

function getSessionUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

function requireUser(req, res) {
  const user = getSessionUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Debes iniciar sesion." });
    return null;
  }
  return user;
}

function buildMeta(questions) {
  return {
    sourceNote: "Banco original de practica inspirado en competencias Saber 11. No corresponde a preguntas oficiales del ICFES.",
    areas: getAreaInfo().map((area) => ({
      ...area,
      count: questions.filter((question) => question.areaId === area.id).length
    })),
    total: questions.length
  };
}

function allQuestions() {
  const generated = getQuestionBank();
  const custom = customQuestions();
  return [...generated, ...custom];
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, port: PORT });
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await readJson(req);
      const user = createUser(body);
      const token = user.status === "active" ? makeToken(user) : null;
      sendJson(res, 201, { user, token });
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJson(req);
      const user = authenticate(body.username, body.password);
      const token = makeToken(user);
      sendJson(res, 200, { user, token });
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      sessions.delete(token);
      sendJson(res, 200, { ok: true });
      return true;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const user = requireUser(req, res);
      if (!user) {
        return true;
      }
      sendJson(res, 200, { user: publicUser(user) });
      return true;
    }

    if (req.method === "GET" && url.pathname === "/api/questions") {
      const user = requireUser(req, res);
      if (!user) {
        return true;
      }
      const questions = allQuestions();
      sendJson(res, 200, { meta: buildMeta(questions), questions });
      return true;
    }

    if (req.method === "POST" && url.pathname === "/api/questions/custom") {
      const user = requireUser(req, res);
      if (!user) {
        return true;
      }
      const body = await readJson(req);
      const question = addCustomQuestion(body, user);
      const questions = allQuestions();
      sendJson(res, 201, { question, meta: buildMeta(questions) });
      return true;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/teachers") {
      const user = requireUser(req, res);
      if (!user) {
        return true;
      }
      if (user.role !== "admin") {
        sendJson(res, 403, { error: "Solo el admin puede ver profesores pendientes." });
        return true;
      }
      sendJson(res, 200, { teachers: pendingTeachers() });
      return true;
    }

    const approveMatch = url.pathname.match(/^\/api\/admin\/teachers\/([^/]+)\/approve$/);
    if (req.method === "POST" && approveMatch) {
      const user = requireUser(req, res);
      if (!user) {
        return true;
      }
      const teacher = approveTeacher(decodeURIComponent(approveMatch[1]), user);
      sendJson(res, 200, { teacher });
      return true;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "Ruta API no encontrada." });
      return true;
    }
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Solicitud invalida." });
    return true;
  }

  return false;
}

function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const normalized = path.normalize(decodedPath).replace(/^([/\\])+/, "");
  const filePath = path.resolve(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Ruta no permitida" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "Archivo no encontrado" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handled = await handleApi(req, res, url);
  if (!handled) {
    serveStatic(req, res, url);
  }
});

server.listen(PORT, () => {
  console.log(`Practica ICFES disponible en http://localhost:${PORT}`);
  console.log("Admin inicial: usuario admin / contrasena admin123");
});
