// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const supabase = require('./supabase'); // cliente de Supabase ya configurado

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta a la carpeta "public" (está fuera de /src)
const publicPath = path.join(__dirname, '..', 'public');

// Middlewares globales
app.use(cors());
app.use(express.json());

// Archivos estáticos (index.html, *.js, styles.css, etc.)
app.use(express.static(publicPath));

/**
 * API LOGIN → tabla public."Usuario"
 * Campos usados:
 *  - correo
 *  - contrasena (sin hash en este ejemplo)
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select('id, nombre, correo')
      .eq('correo', email)
      .eq('contrasena', password) // ⚠️ en producción: hasheado
      .maybeSingle();

    if (error) {
      console.error('Error Supabase /api/login:', error);
      return res.status(500).json({
        error: 'Error al consultar el servicio de autenticación.',
      });
    }

    if (!data) {
      return res
        .status(401)
        .json({ error: 'Correo o contraseña incorrectos.' });
    }

    return res.json({
      user: data,
      message: `Bienvenido/a, ${data.nombre}`,
    });
  } catch (err) {
    console.error('Error inesperado /api/login:', err);
    return res.status(500).json({
      error: 'Error interno del servidor. Intenta de nuevo más tarde.',
    });
  }
});

/**
 * API FORMULARIOS (INSERT) → POST /api/formularios
 * Tabla public.formularios
 */
app.post('/api/formularios', async (req, res) => {
  try {
    const {
      nombre,
      documento,
      fecha_afiliacion,
      cargo,
      tipo_documento,
      info_adicional,
      ARL,
      EPS,
      fondo_pension,
      salario,
      telefono,
      correo,
      direccion_residencia,
      fecha_retiro,
      fecha_nacimiento,
      caja_compensacion,
      sexo,
    } = req.body || {};

    // Validación básica de obligatorios
    if (
      !nombre ||
      !documento ||
      !fecha_afiliacion ||
      !cargo ||
      !tipo_documento ||
      !info_adicional ||
      !fecha_nacimiento ||
      !salario ||
      !telefono ||
      !sexo
    ) {
      return res.status(400).json({
        error:
          'Faltan campos obligatorios. Verifica nombre, documento, fechas, cargo, salario, teléfono, sexo e información adicional.',
      });
    }

    const payload = {
      nombre,
      documento: Number(documento),
      fecha_afiliacion, // 'YYYY-MM-DD'
      cargo,
      tipo_documento,
      info_adicional,
      ARL: ARL ?? '',
      EPS: EPS ?? '',
      fondo_pension: fondo_pension ?? '',
      salario: Number(salario) || 0,
      telefono: Number(telefono) || 0,
      correo: correo ?? '',
      direccion_residencia: direccion_residencia ?? '',
      fecha_nacimiento, // 'YYYY-MM-DD'
      caja_compensacion: caja_compensacion ?? '',
      sexo: sexo ?? '',
      // alerta_retiro_enviada queda con el default false
    };

    if (fecha_retiro) {
      payload.fecha_retiro = fecha_retiro; // 'YYYY-MM-DD'
    }

    const { data, error } = await supabase
      .from('formularios')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error insertando en formularios:', error);
      return res.status(500).json({
        error: 'No se pudo guardar el formulario en la base de datos.',
      });
    }

    return res.status(201).json({ data });
  } catch (err) {
    console.error('Error inesperado /api/formularios POST:', err);
    return res.status(500).json({
      error: 'Error interno del servidor al guardar el formulario.',
    });
  }
});

/**
 * API FORMULARIOS (LISTAR) → GET /api/formularios
 * Se usa en el dashboard y en la página de gestión.
 */
app.get('/api/formularios', async (req, res) => {
  try {
    const { data, error } = await supabase.from('formularios').select('*');

    if (error) {
      console.error('Error obteniendo formularios:', error);
      return res
        .status(500)
        .json({ error: 'No se pudieron obtener los formularios.' });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Error inesperado /api/formularios GET:', err);
    return res.status(500).json({
      error: 'Error interno del servidor al obtener formularios.',
    });
  }
});

/**
 * API FORMULARIOS (OBTENER UNO) → GET /api/formularios/:id
 * Se usa en el modal "Ver" de la página de gestión.
 */
app.get('/api/formularios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener formulario por id:', error);
      return res
        .status(500)
        .json({ error: 'No se pudo obtener el formulario.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error inesperado GET /api/formularios/:id:', err);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor al buscar empleado.' });
  }
});

/**
 * API FORMULARIOS (ACTUALIZAR) → PUT /api/formularios/:id
 * Se usa al editar un empleado desde employees.html
 */
app.put('/api/formularios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const {
      nombre,
      documento,
      fecha_afiliacion,
      cargo,
      tipo_documento,
      info_adicional,
      ARL,
      EPS,
      fondo_pension,
      salario,
      telefono,
      correo,
      direccion_residencia,
      fecha_retiro,
      fecha_nacimiento,
      caja_compensacion,
      sexo,
    } = req.body || {};

    if (
      !nombre ||
      !documento ||
      !fecha_afiliacion ||
      !cargo ||
      !tipo_documento ||
      !info_adicional ||
      !fecha_nacimiento ||
      !salario ||
      !telefono ||
      !sexo
    ) {
      return res.status(400).json({
        error:
          'Faltan campos obligatorios al actualizar. Verifica nombre, documento, fechas, cargo, salario, teléfono, sexo e información adicional.',
      });
    }

    const payload = {
      nombre,
      documento: Number(documento),
      fecha_afiliacion,
      cargo,
      tipo_documento,
      info_adicional,
      ARL: ARL ?? '',
      EPS: EPS ?? '',
      fondo_pension: fondo_pension ?? '',
      salario: Number(salario) || 0,
      telefono: Number(telefono) || 0,
      correo: correo ?? '',
      direccion_residencia: direccion_residencia ?? '',
      fecha_nacimiento,
      caja_compensacion: caja_compensacion ?? '',
      sexo: sexo ?? '',
    };

    if (fecha_retiro !== undefined) {
      payload.fecha_retiro = fecha_retiro || null;
    }

    const { data, error } = await supabase
      .from('formularios')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando formulario:', error);
      return res
        .status(500)
        .json({ error: 'No se pudo actualizar el formulario.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }

    return res.json({ data });
  } catch (err) {
    console.error('Error inesperado PUT /api/formularios/:id:', err);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor al actualizar empleado.' });
  }
});

/**
 * API FORMULARIOS (ELIMINAR) → DELETE /api/formularios/:id
 * Se usa en la página de gestión para eliminar un empleado.
 */
app.delete('/api/formularios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando formulario:', error);
      return res
        .status(500)
        .json({ error: 'No se pudo eliminar el formulario.' });
    }

    return res.status(204).send(); // sin contenido, todo ok
  } catch (err) {
    console.error('Error inesperado DELETE /api/formularios/:id:', err);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor al eliminar empleado.' });
  }
});

/**
 * PÁGINAS FRONT
 *  - index.html lo sirve directamente express.static al ir a "/"
 *  - form.html en /form
 *  - dashboard.html en /dashboard
 *  - employees.html en /empleados
 */

app.get('/form', (req, res) => {
  res.sendFile(path.join(publicPath, 'form.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

app.get('/empleados', (req, res) => {
  res.sendFile(path.join(publicPath, 'employees.html'));
});

/**
 * Catch-all:
 * cualquier ruta que no exista en la API ni en las páginas específicas
 * devuelve el login (index.html).
 */
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
