# 🚀 lib-e2e-cypress-for-dummys

## 🧐 ¿Qué hace?

- 🎥 Graba interacciones de usuario (clicks, inputs, selects...) y las convierte en comandos Cypress (`cy.get(...).click()`, `cy.get(...).type()`, etc.).
- 🌐 Genera automáticamente comandos para interceptar peticiones HTTP y esperarlas con Cypress (`cy.intercept`, `cy.wait`).
- 🟢 Permite iniciar y parar la grabación desde un botón flotante o mediante atajos de teclado (`Ctrl+R`, `Ctrl+1`, `Ctrl+2`, `Ctrl+3`).
- 📋 Exporta los comandos generados para que los pegues directamente en tus tests Cypress.
- 💾 Guarda y gestiona tus pruebas grabadas en una base de datos indexada (IndexedDB) local, accesible desde la propia interfaz.
- 🗂️ Visualiza, copia, elimina y organiza tus pruebas guardadas desde un editor visual avanzado.
- 📦 Importa y exporta todos tus tests e interceptores en formato JSON desde el panel de configuración.
- ⚙️ Panel de configuración visual: selecciona idioma, gestiona la base de datos, activa opciones avanzadas y realiza migraciones.
- 🧩 Soporte para interceptores Cypress asociados a cada test.
- 🧠 Generación de selectores robustos: prioriza `[data-cy]` y filtra ids generados automáticamente por frameworks.
- 🌍 Soporte multilenguaje: Español, Inglés, Francés, Italiano y Alemán. Seleccionable desde la interfaz.
- 🔒 Persistencia robusta: tus pruebas y configuraciones se mantienen aunque cierres el navegador.
- 🛠️ Configuración avanzada de comandos HTTP: activa validaciones automáticas en GET/POST/PUT para objetos recibidos/enviados.
- 👀 Previsualización y copia rápida de comandos e interceptores desde la interfaz.

---

## ⚡ Instalación

1. Instala la librería en tu proyecto Angular:

```bash
npm install lib-e2e-cypress-for-dummys
```

> **Nota:** Las dependencias necesarias como `ngx-indexed-db` se instalarán automáticamente si no las tienes, ya que están en las `peerDependencies` de la librería.  
> Solo asegúrate de tener `@angular/core` y `@angular/common` versión **18.0.0 o superior**.

---

## 🚦 Uso básico

### 1. **Configura la base de datos indexada (IndexedDB)**

En tu archivo de configuración (por ejemplo, `app.config.ts` o tu módulo principal):

```typescript
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { dataBaseConfiguration } from 'lib-e2e-cypress-for-dummys';

@NgModule({
  imports: [
    NgxIndexedDBModule.forRoot(dataBaseConfiguration),
    // ...otros imports
  ],
})
export class AppModule {}
```

### 2. **Importa el componente principal en tu módulo o componente standalone:**

```typescript
import { LibE2eRecorderComponent } from 'lib-e2e-cypress-for-dummys';
```

### 3. **Añade el componente en tu template principal (por ejemplo, en `app.component.html`):**

```html
<lib-e2e-recorder></lib-e2e-recorder>
```

### 4. **Marca los elementos que quieras que sean fácilmente seleccionables por Cypress usando el atributo `data-cy`:**

```html
<input data-cy="email-input" type="email" />
<button data-cy="login-button">Login</button>
```

### 5. **(Opcional) Si quieres grabar las llamadas HTTP/interceptores, añade el interceptor en tu configuración de la app**

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CypressHttpInterceptor } from 'lib-e2e-cypress-for-dummys';

export const appConfig = {
  providers: [
    // ...otros providers...
    provideHttpClient(withInterceptors([CypressHttpInterceptor])),
  ],
};
```

### 6. **¡Listo! Usa la interfaz:**

- Haz clic en el botón flotante ▶️ "Grabar" o usa `Ctrl+R` para empezar a grabar. Interactúa con la app y, cuando termines, pulsa ⏹️ "Parar".
- Pulsa 📋 o `Ctrl+2` para ver la previsualización de comandos generados.
- Pulsa 🗂️ o `Ctrl+1` para abrir el editor visual de pruebas guardadas (puedes expandir, copiar, eliminar y ver interceptores asociados).
- Pulsa ⚙️ o `Ctrl+3` para abrir el panel de configuración (idioma, exportar/importar, opciones avanzadas).

---

## 🧩 Funcionalidades avanzadas

- **Soporte multilenguaje:** Cambia el idioma de la interfaz entre Español, Inglés, Francés, Italiano y Alemán desde el panel de configuración.
- **Exportación/Importación masiva:** Exporta todos tus tests e interceptores a un archivo JSON e impórtalos en otro proyecto o equipo.
- **Configuración avanzada de HTTP:** Activa validaciones automáticas para objetos en comandos GET/POST/PUT.
- **Atajos de teclado:** Controla la grabación y abre paneles rápidamente (`Ctrl+R`, `Ctrl+1`, `Ctrl+2`, `Ctrl+3`).
- **Editor visual de pruebas:** Visualiza, copia, elimina y organiza tus pruebas guardadas. Expande cada test para ver comandos e interceptores asociados.
- **Previsualización y copia rápida:** Copia al portapapeles los comandos Cypress o solo los interceptores con un clic.
- **Persistencia robusta:** Todos los datos se almacenan en IndexedDB y se mantienen aunque cierres el navegador.
- **Selector inteligente:** Prioriza `[data-cy]` y filtra ids generados automáticamente para selectores robustos.
- **Migración de BBDD:** La estructura de la base de datos está preparada para migraciones y ampliaciones futuras.

---

## 💡 Ejemplo de comandos generados

```js
it('Login de usuario', () => {
  cy.viewport(1900, 1200)
  cy.visit('/login')
  cy.get('[data-cy="email-input"]').clear().type('usuario@dominio.com')
  cy.get('[data-cy="password-input"]').clear().type('123456')
  cy.get('[data-cy="login-button"]').click()
  cy.intercept('POST', '**/api/v1/login/**', (req) => {
    if (req.url.includes('login')) {
      req.alias = 'api-v1-login';
    }
  });
  cy.wait('@api-v1-login').then((interception) => { })
});
```

---

## 👍 Recomendaciones

- Usa siempre el atributo `data-cy` en los elementos que quieras testear para obtener selectores robustos.
- Los comandos generados aparecen en la consola del navegador al parar la grabación y también en la interfaz de previsualización.
- Puedes limpiar la lista de comandos llamando a `clearCommands()` desde el servicio si lo necesitas.
- Las pruebas guardadas en IndexedDB son persistentes: no se borran al cerrar el navegador ni al reiniciar el ordenador (salvo que el usuario borre manualmente los datos del sitio o use modo incógnito).
- Para migrar o compartir tus pruebas entre proyectos, usa la funcionalidad de exportar/importar desde el panel de configuración.

---

## ⚠️ Limitaciones

- Solo soporta Angular **18+**.
- Los comandos se generan en la consola y en la interfaz, no en un archivo físico.
- No cubre todos los posibles eventos o componentes personalizados.
- Si cambias la estructura de la BBDD, asegúrate de actualizar la versión en la configuración para evitar errores de migración.

---

## 🚧 Estado del proyecto

Esta librería está en desarrollo activo y puede contener errores o carecer de algunas funcionalidades.  
Si tienes sugerencias, encuentras algún problema o necesitas una nueva característica, no dudes en escribirme a **gonzalocarmenado@gmail.com**. ¡Tu feedback es bienvenido y me ayuda a mejorar el proyecto!

## 🤝 Contribuir

¿Quieres mejorar la librería? ¡Genial! Puedes abrir issues o pull requests en el repositorio. Si tienes dudas, contacta con el autor a través del correo **gonzalocarmenado@gmail.com**.

---

## 📄 Licencia

MIT

---

**Autor:** Gonzalo