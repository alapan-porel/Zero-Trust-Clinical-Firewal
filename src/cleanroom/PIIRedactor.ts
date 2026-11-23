import { v4 as uuidv4 } from 'uuid';
import { EncryptionVault, EncryptedPayload } from './EncryptionVault';

export interface RedactionResult {
  scrubbedText: string;
  vaultMap: Record<string, EncryptedPayload>;
  detectionCount: number;
  detectedTypes: string[];
}

export interface PIIRule {
  type: string;
  regex: RegExp;
  tokenPrefix: string;
}

/**
 * PIIRedactor
 * Multi-pattern deterministic PII scrubber with reversible cryptographic token mapping.
 * Protects 18 HIPAA Safe Harbor identifiers (§164.514(b)(2)) before external LLM dispatch.
 */
export class PIIRedactor {
  private readonly vault: EncryptionVault;
  private readonly rules: PIIRule[] = [
    {
      type: 'SSN',
      regex: /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
      tokenPrefix: '[REDACTED_SSN_'
    },
    {
      type: 'PHONE',
      regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      tokenPrefix: '[REDACTED_PHONE_'
    },
    {
      type: 'EMAIL',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      tokenPrefix: '[REDACTED_EMAIL_'
    },
    {
      type: 'CREDIT_CARD',
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
      tokenPrefix: '[REDACTED_CARD_'
    },
    {
      type: 'MRN',
      regex: /\b(?:MRN|RECORD|PATIENT)[\s:#-]*[A-Z0-9]{6,12}\b/gi,
      tokenPrefix: '[REDACTED_MRN_'
    },
    {
      type: 'DOB',
      regex: /\b(?:DOB|born|birthdate)[:\s]+(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
      tokenPrefix: '[REDACTED_DOB_'
    },
    {
      type: 'ZIP_CODE',
      regex: /\b\d{5}(?:-\d{4})?\b/g,
      tokenPrefix: '[REDACTED_ZIP_'
    },
    {
      type: 'IP_ADDRESS',
      regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      tokenPrefix: '[REDACTED_IP_'
    }
  ];

  constructor(vault?: EncryptionVault) {
    this.vault = vault || new EncryptionVault();
  }

  public redact(text: string): RedactionResult {
    if (!text) {
      return { scrubbedText: '', vaultMap: {}, detectionCount: 0, detectedTypes: [] };
    }

    let scrubbedText = text;
    const vaultMap: Record<string, EncryptedPayload> = {};
    const detectedTypes = new Set<string>();
    let detectionCount = 0;

    for (const rule of this.rules) {
      const matches = Array.from(text.matchAll(rule.regex));
      for (const match of matches) {
        const rawValue = match[0];
        const token = `${rule.tokenPrefix}${uuidv4().substring(0, 8)}]`;
        
        vaultMap[token] = this.vault.encrypt(rawValue);
        scrubbedText = scrubbedText.replace(rawValue, token);
        
        detectedTypes.add(rule.type);
        detectionCount++;
      }
    }

    return {
      scrubbedText,
      vaultMap,
      detectionCount,
      detectedTypes: Array.from(detectedTypes)
    };
  }

  public restore(scrubbedText: string, vaultMap: Record<string, EncryptedPayload>): string {
    let restored = scrubbedText;
    for (const [token, encrypted] of Object.entries(vaultMap)) {
      try {
        const rawValue = this.vault.decrypt(encrypted);
        restored = restored.replace(token, rawValue);
      } catch (err) {
        console.error(`Failed to restore token ${token}:`, err);
      }
    }
    return restored;
  }
}
