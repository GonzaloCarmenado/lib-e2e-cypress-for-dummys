const fs = require('fs');
const path = require('path');

// Ruta al package.json del proyecto donde se instala la librería
const pkgPath = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('No se encontró package.json en el directorio actual.');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.scripts = pkg.scripts || {};
// Añade el script para lanzar dummyserver.js
pkg.scripts['dummyserver'] = 'node ./node_modules/lib-e2e-cypress-for-dummys/projects/lib-e2e-cypress-for-dummys/dummyserver.js';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Script "dummyserver" añadido a package.json');
