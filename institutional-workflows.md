# Institutional asset workflows

Orbis1 is developing infrastructure for institutions to issue, administer and transfer tokenised real-world rights across markets. Qatar is proposed as the company's headquarters, initial regulated market and GCC launchpad. This page describes a development plan; it does not represent regulatory approval or an institutional production deployment.

## Existing foundation and proposed pilot

The published [Node.js](/node/) and [React Native](/react-native/) SDKs provide RGB wallet operations, technical asset issuance and transfers. [Watch Tower](/node/watch-tower) monitors invoices; [Gas-Free](/node/gas-free) contributes Bitcoin fee inputs through collaborative signing. These capabilities do not establish legal title or implement a complete regulated-asset service.

The proposed first evaluation is a controlled private-company share or fund-unit workflow with an appropriately authorised issuer/operator. The precise asset, Qatar deployment roles and operator permissions remain to be defined. Fiat settlement would be handled separately by appropriate providers. Investor-facing crypto payments, stablecoin fees and a secondary-market exchange are outside this pilot's scope.

The workflow needs evidence of underlying rights, verified investor eligibility, issuer/operator approval, restricted transfers, reconciled registers, audit records and tested recovery. Each needs implementation and operator testing beyond the SDK primitives. Software checks must constrain the actual transfer path; an approval screen alone cannot prevent bypass through another wallet.

## Qatar activity boundaries

This is a scoping assessment, pending QFCA/QFCRA confirmation for the actual entities, asset and operations. The [Digital Asset Regulations, Articles 18–23](https://qfcra-en.thomsonreuters.com/entiresection/15149) require licensing for token services in or from QFC; selling software alone is distinguished from facilitating token transfers.

| Function | Scope to confirm before deployment |
|---|---|
| Selling SDK/API software | Business licence and software-provider activity; actual managed services need separate review. |
| Certifying ownership of underlying rights | Licensed legal validation; RGB state verification is a different function. |
| Generating a token for an asset owner | Licensed token generation, rights evidence and applicable technology guidance. |
| Watch Tower and notifications | Observational software versus a service facilitating execution. |
| Transfer orchestration, co-signing or recovery | Transfer-service and custody/control implications. Client-held keys do not settle the classification. |
| Matching multiple buyers and sellers | Token-exchange scope; excluded from the first pilot. |

For shares or fund units, underlying investment rules also apply. The [Investment Token Rules, Chapter 2](https://qfcra-en.thomsonreuters.com/entiresection/15121) retain regulation of the represented rights, restrict currency/payment tokens, and address custody and exchange/settlement activities. The exact asset, offering, investor population and operator permissions need assessment. There is no blanket software exemption for managed operations.

## Can RGB and Bitcoin remain?

RGB remains an infrastructure candidate. It has not been confirmed as suitable or approved for the Qatar proposal. [Digital Asset Regulations, Articles 8–14](https://qfcra-en.thomsonreuters.com/sites/default/files/net_file_store/QFCRA_15128_VER1.pdf) address permitted rights, token generation, control and legal transfer. Technology-neutral wording does not approve a particular network.

Before selecting RGB, obtain a determination on Bitcoin anchoring and network fees, client-side state, enforceable restrictions, operator control, cancellation/reissue, recovery, audit access and finality. Keep existing Gas-Free and RGB-asset fee flows out of the proposed Qatar evaluation until specifically assessed. [QFCRA's excluded-token clarification](https://www.qfcra.com/news/qfc-regulatory-authority-clarifies-that-cryptocurrencies-stablecoins-and-certain-other-virtual-assets-are-excluded-tokens-under-the-new-digital-assets-framework/) must inform both the asset design and the operating model.

An adapter boundary should separate rights and operator policy from the underlying token system. Another system would require its own assessment and integration if RGB cannot meet the confirmed requirements; no alternative is represented as already implemented.

## Development gates

1. Agree the asset, rights, jurisdictions and responsibility of every participant with the operator and relevant authorities.
2. Demonstrate controls with synthetic data; test direct-transfer bypass, replay, key loss, state loss, cancellation/reissue and register reconciliation.
3. Select the token infrastructure only after technical and regulatory scoping. Record keys, consignment storage, fee funding and every signing/broadcast step.
4. Complete independent security work and resolve material findings. Obtain all necessary permissions before a live asset pilot.

QFC rules govern activities in or from QFC. International deployment requires assessment in each relevant market. See [QFC's digital-assets setup pathway](https://www.qfc.qa/en/business-solutions/digital-assets/) for activity classification and authorisation steps.
