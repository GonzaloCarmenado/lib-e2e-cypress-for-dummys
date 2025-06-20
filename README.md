# 🚀 lib-e2e-cypress-for-dummys

<table>
  <tr>
    <td width="200" align="center">
      <img src="lib-images/icon-text.png" alt="lib-e2e-cypress-for-dummys logo" width="140"/>
    </td>
    <td>
      <p>
        <strong>🇪🇸 <a href="./README.es.md">Leer este README en español</a></strong>
      </p>
      <strong>lib-e2e-cypress-for-dummys</strong> is an Angular library that automatically records the Cypress commands needed to test your application while you browse and use the interface.<br>
      Ideal for developers who want to speed up E2E test creation without writing them manually.<br>
      🎬 Record, copy, save, import/export, and manage your E2E tests in seconds!
    </td>
  </tr>
</table>

## 🧐 What does it do?

- 🎥 Records user interactions (clicks, inputs, selects...) and converts them into Cypress commands (`cy.get(...).click()`, `cy.get(...).type()`, etc.).
- 🌐 Automatically generates commands to intercept and wait for HTTP requests using Cypress (`cy.intercept`, `cy.wait`).
- 🟢 Allows starting and stopping the recording from a floating button on the interface.
- 📋 Exports the generated commands so you can paste them directly into your Cypress tests.
- 💾 Saves and manages recorded tests in a local IndexedDB database, accessible from the interface itself.
- 🗂️ View, copy, delete, and organize your saved tests from a visual editor.
- 📦 Import and export all your tests and database settings with a single click.
- ⚙️ Configuration panel to manage the database and other advanced options.
- 🧩 Support for Cypress interceptors associated with each test.
- 🧠 Generates robust selectors: prioritizes `[data-cy]` and filters auto-generated IDs from frameworks.

---

## ⚡ Installation

1. Install the library in your Angular project:

```bash
npm install lib-e2e-cypress-for-dummys
```

> **Note:** Required dependencies like `ngx-indexed-db` will be installed automatically if you don’t already have them, as they are listed in the library’s `peerDependencies`.  
> Just make sure you have `@angular/core` and `@angular/common` version **18.0.0 or higher**.  

> You also need to install the **primeng** library in the version suitable for your Angular version.
---

## 🚦 Basic Usage

### 1. **Configure IndexedDB**

In your configuration file (e.g., `app.config.ts` or main module):

```typescript
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { dataBaseConfiguration } from 'lib-e2e-cypress-for-dummys';

@NgModule({
  imports: [
    NgxIndexedDBModule.forRoot(dataBaseConfiguration),
    // ...other imports
  ],
})
export class AppModule {}
```

### 2. **Import the main component into your module or standalone component:**

```typescript
import { LibE2eRecorderComponent } from 'lib-e2e-cypress-for-dummys';
```

### 3. **Add the component in your main template (e.g., in `app.component.html`):**

```html
<lib-e2e-recorder></lib-e2e-recorder>
```

### 4. **Tag elements you want easily selectable by Cypress with the `data-cy` attribute:**

```html
<input data-cy="email-input" type="email" />
<button data-cy="login-button">Login</button>
```

### 5. **(Optional but recommended) If you want to record HTTP calls/interceptors as well, add the interceptor to your app config**  
   In your `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CypressHttpInterceptor } from 'lib-e2e-cypress-for-dummys';

export const appConfig = {
  providers: [
    // ...other providers...
    provideHttpClient(withInterceptors([CypressHttpInterceptor])),
  ],
};
```

### 6. **Done! Use the interface:**

- Click the floating ▶️ "Record" button to start recording. Interact with the app, then press ⏹️ "Stop".
- Click 📋 to view the list of saved tests (they’re stored in IndexedDB and accessible for copying or deletion).
- Click 📝 to preview the generated Cypress commands from the current session.
- Click ⚙️ to open the configuration panel, where you can import/export the entire database of tests/interceptors.

---

## 🛠️ How does it work?

The library listens to user events (click, input, change) on elements with `data-cy` or `id`, and generates the corresponding Cypress commands.  
If configured, it also intercepts HTTP requests made by Angular and adds `cy.intercept` and `cy.wait` commands to ensure your tests are robust.

When you save a test, it is stored in IndexedDB with a description, date, and the full generated Cypress block.  
You can view, copy, or delete saved tests from the extension’s interface.  
You can also import/export the entire test and interceptor database in JSON format.

---

## 🧩 Advanced Features

- **Visual Test Editor:** View, copy, delete, and organize your saved tests. Each test can be expanded to view its Cypress commands and associated interceptors.
- **"Copy" Button:** Copy the full Cypress command block or only the associated interceptors to your clipboard.
- **"Delete" Button:** Remove a saved test from the database.
- **Configuration Panel:** Export all tests/interceptors to a JSON file and import from one to restore or migrate data between projects.
- **Smart Selector:** Prioritizes `[data-cy]` and filters out auto-generated IDs to avoid fragile selectors.
- **Database Migration:** The database structure is prepared for future migrations and expansions.

---

## 💡 Example of Generated Commands

```js
it('User login', () => {
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

## 👍 Recommendations

- Always use the `data-cy` attribute on elements you want to test for robust selectors.
- Generated commands appear in the browser console after stopping the recording and also in the preview interface.
- You can clear the command list by calling `clearCommands()` from the service if needed.
- Tests saved in IndexedDB are persistent: they won’t be deleted when you close the browser or restart the computer (unless manually cleared or using incognito mode).
- To migrate or share your tests across projects, use the export/import functionality from the configuration panel.

---

## ⚠️ Limitations

- Only supports Angular **18+**.
- Commands are generated in the console and UI, not as physical files.
- Does not cover all possible events or custom components.
- If you change the DB structure, make sure to update the version in the configuration to avoid migration errors.

---

## 🚧 Project Status

This library is under active development and may contain bugs or lack certain features.  
If you have suggestions, encounter any issues, or need a new feature, feel free to email me at **gonzalocarmenado@gmail.com**. Your feedback is welcome and helps improve the project!

## 🤝 Contributing

Want to improve the library? Great! You can open issues or pull requests in the repository. If you have any questions, contact the author at **gonzalocarmenado@gmail.com**.

---

## 📄 License

MIT

---

**Author:** Gonzalo