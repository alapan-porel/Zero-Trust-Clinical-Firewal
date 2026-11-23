export type ViolationSeverity = 'safe' | 'warning' | 'blocked';

export type ClinicalViolationType =
  | 'medical_diagnosis'
  | 'medication_prescription'
  | 'contraindicated_advice'
  | 'lethal_instruction';

export interface ValidationViolation {
  type: ClinicalViolationType;
  pattern: string;
  rationale: string;
}

export interface ClinicalValidationResult {
  isSafe: boolean;
  severity: ViolationSeverity;
  violations: ValidationViolation[];
  sanitizedResponse: string;
}

/**
 * ClinicalValidator
 * Egress inspection firewall preventing unlicensed medical practice, automated diagnoses,
 * prescription recommendations, and ungrounded psychopharmacological guidance.
 */
export class ClinicalValidator {
  private readonly diagnosisPatterns = [
    /\b(?:you have|i diagnose you with|diagnosed with|suffering from)\s+(?:bipolar|schizophrenia|mdd|major depressive disorder|ptsd|ocd|borderline personality)\b/gi,
    /\b(?:my clinical diagnosis is|based on DSM-5, you have)\b/gi
  ];

  private readonly medicationPatterns = [
    /\b(?:take|prescribe|dosage of|increase your dose of|start taking)\s+(?:sertraline|zoloft|lexapro|prozac|xanax|ativan|adderall|ritalin|lithium|fluoxetine|escitalopram)\b/gi,
    /\b(?:you need medication|i recommend taking|taper off your)\s+[a-z0-9]+/gi
  ];

  private readonly dangerousPatterns = [
    /\b(?:how to cut yourself|ways to end life|painless way to die|methods of suicide)\b/gi
  ];

  public validateEgress(llmOutput: string): ClinicalValidationResult {
    const violations: ValidationViolation[] = [];

    // Check dangerous content
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(llmOutput)) {
        violations.push({
          type: 'lethal_instruction',
          pattern: pattern.source,
          rationale: 'Harmful instructions strictly prohibited under clinical firewall rules.'
        });
      }
    }

    // Check diagnoses
    for (const pattern of this.diagnosisPatterns) {
      if (pattern.test(llmOutput)) {
        violations.push({
          type: 'medical_diagnosis',
          pattern: pattern.source,
          rationale: 'Automated diagnostic statements violate clinical licensing standards.'
        });
      }
    }

    // Check medication prescriptions
    for (const pattern of this.medicationPatterns) {
      if (pattern.test(llmOutput)) {
        violations.push({
          type: 'medication_prescription',
          pattern: pattern.source,
          rationale: 'Unsupervised pharmacological guidance violates clinical boundaries.'
        });
      }
    }

    if (violations.some(v => v.type === 'lethal_instruction')) {
      return {
        isSafe: false,
        severity: 'blocked',
        violations,
        sanitizedResponse: 'I am unable to fulfill this request. If you are experiencing distress, please reach out to the 988 Crisis Lifeline.'
      };
    }

    if (violations.some(v => v.type === 'medical_diagnosis' || v.type === 'medication_prescription')) {
      return {
        isSafe: false,
        severity: 'blocked',
        violations,
        sanitizedResponse: 'As an AI therapeutic companion, I cannot diagnose medical conditions or recommend medications. Please consult a licensed psychiatrist or physician for formal evaluation and prescription management.'
      };
    }

    return {
      isSafe: true,
      severity: 'safe',
      violations: [],
      sanitizedResponse: llmOutput
    };
  }
}
