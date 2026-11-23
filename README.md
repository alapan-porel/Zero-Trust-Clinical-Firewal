# Zero-Trust Layer 0 Clinical Cleanroom & HIPAA/GDPR LLM Firewall

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org/)
[![Compliance](https://img.shields.io/badge/Compliance-HIPAA%20Safe%20Harbor%20%7C%20GDPR%20Art.%209-green.svg)](#)

A high-assurance, zero-trust cryptographic cleanroom and clinical egress firewall designed for deploying Large Language Models (LLMs) in sensitive healthcare, psychiatric, and mental health applications.

---

## Architectural Overview

```
 [ Patient Inbound Message ]
              │
              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 1. Zero-Trust Ingress Cleanroom                       │
   │    ├─ HIPAA §164.514(b) Regex & Pattern Redactor       │
   │    └─ Authenticated AES-256-GCM Reversible Vault       │
   └──────────────────────────┬─────────────────────────────┘
                              │
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 2. Clinical Risk & Affect Engine                       │
   │    ├─ C-SSRS Crisis Router (Emergency Interception)    │
   │    └─ 6-Axis Affective Emotion Classifier              │
   └──────────────────────────┬─────────────────────────────┘
                              │ (If Safe: Scrubbed Prompt)
                              ▼
                [ External LLM Provider ]
                              │ (Generated Response)
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 3. Clinical Egress Firewall                            │
   │    ├─ Medical Diagnosis Blocker (DSM-5 Compliance)     │
   │    └─ Psychopharmacological Prescribing Interceptor    │
   └──────────────────────────┬─────────────────────────────┘
                              │
                              ▼
              [ Sanitized Clinical Response ]
```

---

## Core Capabilities

1. **Deterministic PII Scrubbing**: Detects and redacts 18 HIPAA Safe Harbor identifiers (SSN, Phone, Email, MRN, Dates, IP addresses) before data touches external LLM infrastructure.
2. **Reversible Cryptographic Vault**: AES-256-GCM with PBKDF2 (100,000 iterations) securely stores original identifiers in memory or encrypted state for local reconstruction upon client return.
3. **C-SSRS Crisis Escalation Router**: Evaluates suicide and self-harm risk across 3 weighted tiers. Immediate emergency intervention suppress autonomous LLM dispatch and injects crisis hotlines (988, Crisis Text Line).
4. **Clinical Recommendation Egress Firewall**: Sanitizes AI model outputs, catching unlicensed diagnoses and medication instructions.

---

## Installation & Quickstart

```bash
npm install
npm run build
npm test
```

### Basic Usage

```typescript
import { ClinicalCleanroomFacade } from 'pii-clinical-cleanroom';

const cleanroom = new ClinicalCleanroomFacade(process.env.CLINICAL_VAULT_MASTER_KEY);

// 1. Inspect and Scrub Inbound Prompt
const inbound = cleanroom.inspectInbound(
  "Hello, I am Jane Doe (SSN: 000-12-3456). I've been feeling deeply depressed."
);

console.log(inbound.cleanroomScrubbedPrompt);
// Output: "Hello, I am Jane Doe (SSN: [REDACTED_SSN_a1b2c3d4]). I've been feeling deeply depressed."

// 2. Validate Outbound LLM Generation
const outbound = cleanroom.inspectOutbound(
  "Based on your symptoms, you have MDD and should take 50mg of sertraline."
);

if (!outbound.isSafe) {
  console.log(outbound.sanitizedResponse);
  // Output: "As an AI therapeutic companion, I cannot diagnose medical conditions or recommend medications..."
}
```

---

## Regulatory Compliance Matrix

| Regulation | Requirement | Cleanroom Implementation |
| :--- | :--- | :--- |
| **HIPAA Privacy Rule** | §164.514(b) Safe Harbor De-identification | Automated redactor scrub of all direct patient identifiers |
| **HIPAA Security Rule** | §164.312(a)(2)(iv) Encryption at Rest | AES-256-GCM authenticated cipher with dynamic IV and salt |
| **GDPR Article 9** | Processing of special category health data | Ephemeral tokenization with zero server-side plaintext persistence |
| **C-SSRS Standards** | Columbia Suicide Severity Rating Scale | Deterministic 3-tier severity triage with immediate override protocol |

---

## License

Apache-2.0. Cleanroom extraction and packaging release.
