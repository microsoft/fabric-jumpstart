# Contributing to fabric-jumpstart-web (Website)

> Please read the [root contributing guide](../../CONTRIBUTING.md) first for shared guidelines on issues, commits, and PRs.

## Development Setup

- Install **Node.js** (v20+) and npm.
- Install dependencies:
  ```bash
  cd src/fabric_jumpstart_web && npm install
  ```
- Start the dev server:
  ```bash
  npm run dev    # http://localhost:8080
  ```

## Quality Checks

Run these before submitting a PR:

```bash
cd src/fabric_jumpstart_web
npm run lint       # ESLint
npm run test       # Jest with coverage
npm run build      # Production build (includes content generation)
```

## Key Conventions

- **Framework**: Next.js 15 with static export
- **UI library**: Fluent UI React Components v9
- **i18n**: next-intl (translations in `locales/`)
- **Styling**: CSS modules + Fluent UI tokens
- **Testing**: Jest + React Testing Library
- **Content generation**: `scripts/generate-content.ts` runs automatically as a prebuild step (`npm run generate-content`)

## Project Structure

```
src/fabric_jumpstart_web/
├── src/
│   ├── app/            # Next.js pages and routes
│   ├── components/     # React components
│   ├── config/         # App configuration
│   ├── constants/      # Static constants
│   ├── data/           # Static data and content
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Internationalization setup
│   ├── store/          # State management
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
├── scripts/            # Content generation scripts
├── locales/            # Translation files
├── public/             # Static assets
└── __tests__/          # Jest test suite
```
