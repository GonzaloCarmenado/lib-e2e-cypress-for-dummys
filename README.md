# 🚀 lib-e2e-cypress-for-dummys

**lib-e2e-cypress-for-dummys** es una librería Angular que te permite grabar de forma automática los comandos Cypress necesarios para testear tu aplicación mientras navegas y usas la interfaz.  
Ideal para desarrolladores que quieren acelerar la creación de tests E2E sin tener que escribirlos manualmente.  
🎬 ¡Graba, copia y pega tus tests en segundos!

---

## 🧐 ¿Qué hace?

- 🎥 Graba interacciones de usuario (clicks, inputs, selects) y las convierte en comandos Cypress (`cy.get(...).click()`, `cy.get(...).type()`, etc.).
- 🌐 Genera automáticamente comandos para interceptar peticiones HTTP y esperarlas con Cypress (`cy.intercept`, `cy.wait`).
- 🟢 Permite iniciar y parar la grabación desde un botón flotante en la interfaz.
- 📋 Exporta los comandos generados para que los pegues directamente en tus tests Cypress.

---

## ⚡ Instalación

1. Instala la librería en tu proyecto Angular:

```bash
npm install lib-e2e-cypress-for-dummys
```

2. Asegúrate de tener como peer dependencies `@angular/core` y `@angular/common` versión **18.0.0 o superior**.

3. Añade a los proveedores el la configuración de la BBDD .
```bash
    providers: [
      provideIndexedDb(dbConfig),
    ]
```

---

## 🚦 Uso básico

1. **Importa el componente en tu módulo o componente standalone:**

```ts
import { LibE2eRecorderComponent } from 'lib-e2e-cypress-for-dummys';
```

2. **Añade el componente en tu template principal (por ejemplo, en `app.component.html`):**

```html
<lib-e2e-recorder></lib-e2e-recorder>
```

3. **Marca los elementos que quieras que sean fácilmente seleccionables por Cypress usando el atributo `data-cy`:**

```html
<input data-cy="email-input" type="email" />
<button data-cy="login-button">Login</button>
```

4. **(Opcional pero recomendado) Si quieres que también se graben las llamadas HTTP/interceptores, añade el interceptor en tu configuración de la app**  
   En tu `app.config.ts`:

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

5. **Haz clic en el botón flotante ▶️ "Grabar" para empezar a grabar. Interactúa con la app y, cuando termines, pulsa ⏹️ "Parar".**

6. **Copia los comandos Cypress generados desde la consola del navegador.**

---

## 🛠️ ¿Cómo funciona?

La librería escucha eventos de usuario (click, input, change) sobre elementos con `data-cy` o `id`, y va generando los comandos Cypress correspondientes.  
Además, si configuras el interceptor, intercepta las peticiones HTTP realizadas por Angular y añade los comandos `cy.intercept` y `cy.wait` necesarios para que tus tests sean robustos.

---

## 💡 Ejemplo de comandos generados

```js
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
```

---

## 👍 Recomendaciones

- Usa siempre el atributo `data-cy` en los elementos que quieras testear para obtener selectores robustos.
- Los comandos generados aparecen en la consola del navegador al parar la grabación.
- Puedes limpiar la lista de comandos llamando a `clearCommands()` desde el servicio si lo necesitas.

---

## ⚠️ Limitaciones

- Solo soporta Angular **18+**.
- Los comandos se generan en la consola, no en un archivo.
- No cubre todos los posibles eventos o componentes personalizados.

---

## 🚧 Estado del proyecto

Esta librería está en desarrollo activo y puede contener errores o carecer de algunas funcionalidades.  
Si tienes sugerencias, encuentras algún problema o necesitas una nueva característica, no dudes en escribirme a **gonzalocarmenado@gmail.com**. ¡Tu feedback es bienvenido y me ayuda a mejorar el proyecto!

## 🤝 Contribuir

¿Quieres mejorar la librería? ¡Genial! Puedes abrir issues o pull requests en el repositorio. Si tienes dudas, contacta con el autor.

---

## 📄 Licencia

MIT

---

**Autor:** Gonzalo Carmenado 🚀