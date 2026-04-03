# Orbis1 SDK — Developer Documentation

Source for the [Orbis1 SDK developer docs](https://docs.orbis1.io/), built with [VitePress](https://vitepress.dev) and hosted on GitHub Pages.

## Packages covered

| Package | Registry | Description |
|---|---|---|
| [`orbis1-sdk-node`](https://github.com/Orbis-1/orbis1-sdk-node) | npm | RGB wallet SDK for Node.js |
| [`orbis1-sdk-rn`](https://github.com/Orbis-1/orbis1-sdk-rn) | npm / yarn | RGB wallet SDK for React Native |

## AI Coding Assistant Skill

Install the Orbis1 SDK skill for Claude Code, Cursor, Copilot, and other AI coding assistants:

```bash
npx skills add orbis-1/developer-docs --skill orbis1-sdk --global
```

This skill helps AI assistants correctly use the Orbis1 SDK APIs, handle RGB-specific patterns (base units, UTXO management, gas-free flows), and avoid common mistakes.

**Auto-discovery:** AI agents visiting `https://docs.orbis1.io/` can automatically discover and use the skill via the `.well-known/skills/` endpoint.

## Local development

```bash
npm install
npm run dev
```

The site is served at `http://localhost:5173/developer-docs/`.

## Build

```bash
npm run build
```

Output is written to `.vitepress/dist/`.

## Deployment

Docs are deployed automatically to GitHub Pages on every push to `main` via the [GitHub Actions workflow](.github/workflows/deploy.yml).

Live URL: **https://docs.orbis1.io/**

## Structure

```
developer-docs/
├── index.md                  Landing page
├── introduction.md           Project overview and architecture
├── concepts.md               RGB core concepts primer
├── troubleshooting.md        Common issues and fixes
│
├── node/                     Node.js SDK docs
│   ├── index.md
│   ├── installation.md
│   ├── quickstart.md
│   ├── configuration.md
│   ├── wallet.md
│   ├── gas-free.md
│   ├── watch-tower.md
│   └── examples/
│
├── react-native/             React Native SDK docs
│   ├── index.md
│   ├── installation.md
│   ├── quickstart.md
│   ├── configuration.md
│   ├── wallet.md
│   ├── gas-free.md
│   ├── watch-tower.md
│   └── examples/
│
└── reference/
    ├── error-codes.md
    └── environments.md
```

## Contributing

1. Fork the repo and create a branch from `main`.
2. Edit or add Markdown files under the relevant section.
3. Run `npm run dev` to preview locally.
4. Open a pull request — the build is verified automatically on PR.
