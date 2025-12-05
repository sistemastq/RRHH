// src/server.js
// reemplaza tu require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });



const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const hpp = require("hpp");
const compression = require("compression");
const pinoHttp = require("pino-http")({ autoLogging: true });
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const supabase = require("./supabase"); // tu cliente Supabase

// --- App & Paths ---
const app = express();
const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "..", "public");

// --- Seguridad base ---
app.disable("x-powered-by");
// al inicio de server.js (después de crear app)
app.set('trust proxy', 1);
app.use(pinoHttp);

// usa tu dominio real
app.use(
  cors({
    origin: process.env.APP_ORIGIN || "https://rrhh.midominio.com",
    credentials: true,
  })
);

// CSP + cabeceras de seguridad
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.tailwindcss.com"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://ui-avatars.com"],
        "connect-src": ["'self'", process.env.SUPABASE_URL], // <- importante
      },
    },
  })
);

// Middlewares globales
app.use(compression());
app.use(hpp());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// CORS (si sirves el front desde el mismo servidor, podrías incluso omitir esto)
app.use(
  cors({
    origin: process.env.APP_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Archivos estáticos
app.use(express.static(publicPath));

// --- Rate limits ---
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); // 10 intentos/15min
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 }); // 120 req/min
app.use("/api/login", loginLimiter);
app.use("/api/", apiLimiter);

// --- Helpers de sesión ---
function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, correo: user.correo, role: "rrhh" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("session", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No autorizado" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida" });
  }
}

// Para páginas HTML protegidas (redirige al login si no hay cookie válida)
function guardPage(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.redirect("/");
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.redirect("/");
  }
}

// --- Validación (Zod) ---
const formSchema = z.object({
  nombre: z.string().min(1).max(200),
  documento: z.string().min(4), // si quieres solo dígitos: .regex(/^\d+$/)
  fecha_afiliacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cargo: z.string().min(1).max(120),
  tipo_documento: z.string().min(1).max(10),
  info_adicional: z.string().min(1),
  EPS: z.string().optional().default(''),
  ARL: z.string().optional().default(''),
  fondo_pension: z.string().optional().default(''),
  salario: z.coerce.number().nonnegative(),   // 👈 acepta "2500000" como número
  telefono: z.string().min(7).max(20),        // lo tratamos como string
  correo: z.union([z.string().email(), z.literal('')]).optional(),
  direccion_residencia: z.string().optional().default(''),
  fecha_retiro: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  caja_compensacion: z.string().optional().default(''),
  sexo: z.string().min(1),
});


// =====================
// ======  API  ========
// =====================

/**
 * LOGIN → POST /api/login
 * Tabla public."Usuario" (con contraseña en texto plano en tu BD actual).
 * Emite cookie httpOnly con JWT.
 */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Correo y contraseña son obligatorios." });
  }

  try {
    const { data, error } = await supabase
      .from("Usuario")
      .select("id, nombre, correo, contrasena")
      .eq("correo", email)
      .maybeSingle();

    if (error) {
      req.log.error({ err: error }, "Supabase error /api/login");
      return res
        .status(500)
        .json({ error: "Error al consultar autenticación." });
    }
    if (!data || data.contrasena !== password) {
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });
    }

    // ok → emitir cookie y devolver user (sin contraseña)
    issueSession(res, data);
    const { contrasena, ...userSafe } = data;
    return res.json({
      user: userSafe,
      message: `Bienvenido/a, ${data.nombre}`,
    });
  } catch (err) {
    req.log.error({ err }, "Unexpected /api/login");
    return res.status(500).json({ error: "Error interno." });
  }
});

// LOGOUT → limpia cookie
app.post("/api/logout", (req, res) => {
  res.clearCookie("session", { httpOnly: true, sameSite: "lax" });
  return res.status(204).send();
});

// FORMULARIOS: INSERT
app.post("/api/formularios", requireAuth, async (req, res) => {
  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const payload = {
      ...parsed.data,
      documento: Number(parsed.data.documento),
      salario: Number(parsed.data.salario) || 0,
      telefono: Number(parsed.data.telefono) || 0,
    };

    const { data, error } = await supabase
      .from("formularios")
      .insert([payload])
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Supabase error insert /formularios");
      return res
        .status(500)
        .json({ error: "No se pudo guardar el formulario." });
    }
    return res.status(201).json({ data });
  } catch (err) {
    req.log.error({ err }, "Unexpected POST /formularios");
    return res.status(500).json({ error: "Error interno." });
  }
});

// FORMULARIOS: LISTAR
app.get("/api/formularios", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from("formularios").select("*");
    if (error) {
      req.log.error({ err: error }, "Supabase error list /formularios");
      return res
        .status(500)
        .json({ error: "No se pudieron obtener los formularios." });
    }
    return res.json(data || []);
  } catch (err) {
    req.log.error({ err }, "Unexpected GET /formularios");
    return res.status(500).json({ error: "Error interno." });
  }
});

// FORMULARIOS: OBTENER UNO
app.get("/api/formularios/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  try {
    const { data, error } = await supabase
      .from("formularios")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      req.log.error({ err: error }, "Supabase error get /formularios/:id");
      return res.status(500).json({ error: "No se pudo obtener el registro." });
    }
    if (!data)
      return res.status(404).json({ error: "Empleado no encontrado." });

    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Unexpected GET /formularios/:id");
    return res.status(500).json({ error: "Error interno." });
  }
});

// FORMULARIOS: ACTUALIZAR
app.put("/api/formularios/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const payload = {
      ...parsed.data,
      documento: Number(parsed.data.documento),
      salario: Number(parsed.data.salario) || 0,
      telefono: Number(parsed.data.telefono) || 0,
    };

    // permitir null para fecha_retiro si viene vacío
    if (
      Object.prototype.hasOwnProperty.call(req.body, "fecha_retiro") &&
      !parsed.data.fecha_retiro
    ) {
      payload.fecha_retiro = null;
    }

    const { data, error } = await supabase
      .from("formularios")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      req.log.error({ err: error }, "Supabase error update /formularios/:id");
      return res
        .status(500)
        .json({ error: "No se pudo actualizar el registro." });
    }
    if (!data)
      return res.status(404).json({ error: "Empleado no encontrado." });

    return res.json({ data });
  } catch (err) {
    req.log.error({ err }, "Unexpected PUT /formularios/:id");
    return res.status(500).json({ error: "Error interno." });
  }
});

// FORMULARIOS: ELIMINAR
app.delete("/api/formularios/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  try {
    const { error } = await supabase.from("formularios").delete().eq("id", id);
    if (error) {
      req.log.error({ err: error }, "Supabase error delete /formularios/:id");
      return res
        .status(500)
        .json({ error: "No se pudo eliminar el registro." });
    }
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Unexpected DELETE /formularios/:id");
    return res.status(500).json({ error: "Error interno." });
  }
});

// =====================
// ====  PÁGINAS  ======
// =====================

// Protegidas por cookie de sesión
app.get("/dashboard", guardPage, (req, res) => {
  res.sendFile(path.join(publicPath, "dashboard.html"));
});
app.get("/empleados", guardPage, (req, res) => {
  res.sendFile(path.join(publicPath, "employees.html"));
});
app.get("/form", guardPage, (req, res) => {
  res.sendFile(path.join(publicPath, "form.html"));
});

// Catch-all → login
app.use((req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// --- Manejador global de errores (último) ---
app.use((err, req, res, next) => {
  req.log?.error(err);
  const msg =
    process.env.NODE_ENV === "production"
      ? "Error interno"
      : err.message || "Error";
  res.status(500).json({ error: msg });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
