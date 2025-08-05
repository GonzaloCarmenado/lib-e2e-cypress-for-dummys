
let lastResult = null;
// dummyserver.js
// Servidor Express para lanzar tests de Cypress y reportar resultados por callback

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');


const fs = require('fs');
const path = require('path');

function findProjectRoot(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'cypress.config.ts')) || fs.existsSync(path.join(dir, 'cypress.config.js'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return startDir; // fallback
}

const app = express();
const PORT = 8123;

app.use(cors());
app.use(express.json());

app.post('/run-test', (req, res) => {
  const { specPath, callbackUrl } = req.body;
  console.log(`[INFO] Petición recibida en /run-test con specPath: ${specPath}, callbackUrl: ${callbackUrl}`);

  if (!specPath || !callbackUrl) {
    console.error('[ERROR] Faltan parámetros specPath o callbackUrl');
    return res.status(400).json({ error: 'Faltan parámetros specPath o callbackUrl' });
  }

  // Responder inmediatamente
  res.json({ message: 'Test lanzado correctamente' });

  // Buscar raíz del proyecto (donde está cypress.config)
  const projectRoot = findProjectRoot(process.cwd());
  // Lanzar el test de Cypress
  const cmd = `npx cypress run --spec "${specPath}"`;
  console.log(`[INFO] Ejecutando: ${cmd} (cwd: ${projectRoot})`);
  exec(cmd, { maxBuffer: 1024 * 1024 * 10, cwd: projectRoot }, (error, stdout, stderr) => {
    const exitCode = error && error.code ? error.code : 0;
    const success = exitCode === 0;
    console.log(`[INFO] Test finalizado. exitCode: ${exitCode}`);
    if (stdout) console.log('[STDOUT]', stdout);
    if (stderr) console.log('[STDERR]', stderr);
    lastResult = { success, exitCode, stdout, stderr };
  });
});

app.post('/resultado', (req, res) => {
  lastResult = req.body;
  console.log('[INFO] Resultado recibido en /resultado:', lastResult);
  res.json({ ok: true });
});

// Endpoint para consultar el último resultado
app.get('/resultado/last', (req, res) => {
  if (lastResult) {
    res.json(lastResult);
    lastResult = null; // Limpiar tras leer
  } else {
    res.status(404).json({ error: 'No hay resultado aún' });
  }
});
app.listen(PORT, () => {
  console.log(`\n[INFO] DummyServer escuchando en http://localhost:${PORT}`);
});
