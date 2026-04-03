# Orbis1 SDK — Developer Documentation

Source for the [Orbis1 SDK developer docs](https://orbis-1.github.io/developer-docs/), built with [VitePress](https://vitepress.dev) and hosted on GitHub Pages.

## Packages covered

| Package | Registry | Description |
|---|---|---|
| [`orbis1-sdk-node`](https://github.com/Orbis-1/orbis1-sdk-node) | npm | RGB wallet SDK for Node.js |
| [`orbis1-sdk-rn`](https://github.com/Orbis-1/orbis1-sdk-rn) | npm / yarn | RGB wallet SDK for React Native |

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

Live URL: **https://orbis-1.github.io/developer-docs/**

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
