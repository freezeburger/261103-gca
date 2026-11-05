# Application

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.5.

## Development server

The application needs the json-server API (port 5050) and the Angular dev server (HTTPS, port 4200). One command starts everything:

```bash
npm run dev        # builds the gca library, then runs the API and https://localhost:4200/ side by side (Ctrl+C stops both)
npm run dev:reset  # same, restoring the API seed data first
```

Or run them separately in two terminals:

```bash
npm run api      # json-server on http://localhost:5050 (npm run api:reset restores the seed data)
npm start        # builds the gca library, then serves https://localhost:4200/ with /api proxied to the API
```

Open `https://localhost:4200/` and sign in with `marie.laurent@atelier.dev` / `Atelier2026!` (or `paul.martin@atelier.dev`, same password). The HTTPS certificate lives in `certs/` (not versioned); see [certs/README.md](certs/README.md) to generate it. Architecture details: [ARCHITECTURE.md](workflow/documentation/ARCHITECTURE.md).

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
npm test           # application
npm run test:gca   # gca library
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
