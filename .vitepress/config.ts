import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Orbis1 SDK',
  description:
    'Developer documentation for Orbis1 SDK — RGB asset operations for Node.js and React Native.',
  base: '/developer-docs/',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/developer-docs/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/developer-docs/orbis1.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/developer-docs/orbis1.png' }],
    ['meta', { name: 'theme-color', content: '#f97316' }],
  ],

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
  },

  themeConfig: {
    logo: '/orbis1.png',
    siteTitle: 'Orbis1 SDK',

    nav: [
      { text: 'Introduction', link: '/introduction' },
      {
        text: 'Node.js SDK',
        link: '/node/',
        activeMatch: '/node/',
      },
      {
        text: 'React Native SDK',
        link: '/react-native/',
        activeMatch: '/react-native/',
      },
      // { text: 'Reference', link: '/reference/environments' },
    ],

    sidebar: {
      '/node/': [
        {
          text: 'Node.js SDK',
          items: [
            { text: 'Overview', link: '/node/' },
            { text: 'Installation', link: '/node/installation' },
            { text: 'Quick Start', link: '/node/quickstart' },
            { text: 'Configuration', link: '/node/configuration' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Wallet', link: '/node/wallet' },
            { text: 'Gas-Free', link: '/node/gas-free' },
            { text: 'Watch Tower', link: '/node/watch-tower' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/node/examples/basic-usage' },
            { text: 'Gas-Free Transfer', link: '/node/examples/gas-free-transfer' },
            { text: 'Asset Operations', link: '/node/examples/asset-operations' },
            { text: 'Server Patterns', link: '/node/examples/server-patterns' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Environments', link: '/reference/environments' },
            { text: 'Error Codes', link: '/reference/error-codes' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ],
        },
      ],

      '/react-native/': [
        {
          text: 'React Native SDK',
          items: [
            { text: 'Overview', link: '/react-native/' },
            { text: 'Installation', link: '/react-native/installation' },
            { text: 'Quick Start', link: '/react-native/quickstart' },
            { text: 'Configuration', link: '/react-native/configuration' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Wallet', link: '/react-native/wallet' },
            { text: 'Gas-Free', link: '/react-native/gas-free' },
            { text: 'Watch Tower', link: '/react-native/watch-tower' },
          ],
        },
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/react-native/examples/basic-usage' },
            { text: 'Gas-Free Transfer', link: '/react-native/examples/gas-free-transfer' },
            { text: 'Asset Issuance', link: '/react-native/examples/asset-issuance' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Environments', link: '/reference/environments' },
            { text: 'Error Codes', link: '/reference/error-codes' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ],
        },
      ],

      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/introduction' },
            { text: 'Core Concepts', link: '/concepts' },
          ],
        },
        {
          text: 'SDKs',
          items: [
            { text: 'Node.js SDK', link: '/node/' },
            { text: 'React Native SDK', link: '/react-native/' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Environments', link: '/reference/environments' },
            { text: 'Error Codes', link: '/reference/error-codes' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ],
        },
      ],
    },


    socialLinks: [
      { icon: 'github', link: 'https://github.com/Orbis-1' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/Orbis-1/developer-docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025–present Orbis1 / BitHyve Engineering',
    },
  },
});
