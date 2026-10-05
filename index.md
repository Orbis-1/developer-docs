---
layout: home

hero:
  name: Orbis1 SDK
  text: RGB Asset Operations for Bitcoin
  tagline: Plug-and-Play TypeScript SDKs for Node.js and React Native, with built-in Gas-Free Transfers, RGB Operations, and Watch Tower monitoring.
  actions:
    - theme: brand
      text: Node.js SDK →
      link: /node/
    - theme: alt
      text: React Native SDK →
      link: /react-native/
    - theme: alt
      text: Institutional Workflows
      link: /institutional-workflows

features:
  - icon: 🔐
    title: Full RGB Wallet
    details: Issue, receive, and transfer NIA, UDA, CFA, and IFA assets. Track wallet state and transfer history with blinded and witness invoices.
  - icon: ⚡
    title: Gas-Free Transfers
    details: Send RGB assets to anyone without holding BTC for mining fees. The service covers fees in exchange for a small RGB asset payment.
  - icon: 🗼
    title: Watch Tower
    details: Register invoices for server-side monitoring. Receive push notifications for incoming RGB transfers via FCM.
  - icon: 📦
    title: Single Package
    details: One install gets you everything - core RGB bindings, Gas-Free, and Watch Tower. No dependency trees to manage.
  - icon: 🧩
    title: Modular & Opt-in
    details: Enable only the features you need. Each feature is independently configured and initialized at startup.
  - icon: 🔒
    title: Client Signing
    details: Wallet keys stay with the client; the Gas-Free service signs its own fee inputs. Institutional control and custody responsibilities require separate assessment.
---

## Institutional asset operations

Orbis1 is developing software for institutions to manage tokenised real-world rights. The published RGB SDKs provide wallet and transfer primitives; legal validation, investor eligibility, operator approvals and recovery are additional work. See the [proposed institutional workflow and Qatar scope](/institutional-workflows) for current boundaries and development gates.
