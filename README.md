# FCU Builder

FCU Builder is a JSON-driven firearm configuration app for exploring compatible builds by FCU family.

The app currently includes:
- SIG P365 family
- Ruger RXM family

Compatibility is driven from schema JSON files (source of truth), and the UI enforces a guided selection flow.

## What the app does

- Select an FCU family first.
- Select parts in dependency order:
  1. Grip module
  2. Slide
  3. Barrel
  4. Magazine
  5. Optional compensator
- Disable incompatible options at selection time.
- Show build compatibility status and current selected build card.
- Provide one-click presets for common configurations.

## Source of truth

Compatibility data lives in:
- `src/data/fcu_schemas/p365.json`
- `src/data/fcu_schemas/rxm.json`

The TypeScript logic converts these schemas into runtime parts and applies generic validation using schema-defined compatibility pairs.

## Getting started

### Prerequisites
- Node.js 20+ recommended
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).

## How to use

1. Choose an FCU family.
2. Pick a grip module.
3. Pick a slide (options are filtered/disabled based on prior choices).
4. Pick a barrel.
5. Pick a magazine.
6. Optionally pick a compensator.
7. Use presets at the top for quick loading of known builds.

If a selection would produce an invalid combination, the option is disabled and shows the reason.

## Scripts

- `npm run dev` - start development server
- `npm run test` - run unit tests (Vitest)
- `npm run lint` - run ESLint
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build
