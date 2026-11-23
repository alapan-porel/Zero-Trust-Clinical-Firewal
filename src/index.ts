export * from './cleanroom/EncryptionVault';
export * from './cleanroom/PIIRedactor';
export * from './firewall/CrisisRouter';
export * from './firewall/ClinicalValidator';
export * from './firewall/EmotionDetector';

import { EncryptionVault } from './cleanroom/EncryptionVault';
import { PIIRedactor, RedactionResult } from './cleanroom/PIIRedactor';
import { CrisisRouter, RiskAssessment } from './firewall/CrisisRouter';
import { ClinicalValidator, ClinicalValidationResult } from './firewall/ClinicalValidator';
import { EmotionDetector, EmotionProfile } from './firewall/EmotionDetector';

export interface CleanroomInspectionReport {
  timestamp: string;
  redaction: RedactionResult;
  risk: RiskAssessment;
  emotion: EmotionProfile;
  isDispatchAllowed: boolean;
  cleanroomScrubbedPrompt: string;
}

/**
 * ClinicalCleanroomFacade
 * Layer 0 Clinical Cleanroom orchestrator handling intake redaction, emotional classification,
 * crisis escalation routing, and egress LLM safety enforcement.
 */
export class ClinicalCleanroomFacade {
  public readonly vault: EncryptionVault;
  public readonly redactor: PIIRedactor;
  public readonly crisisRouter: CrisisRouter;
  public readonly clinicalValidator: ClinicalValidator;
  public readonly emotionDetector: EmotionDetector;

  constructor(masterKey?: string) {
    this.vault = new EncryptionVault(masterKey);
    this.redactor = new PIIRedactor(this.vault);
    this.crisisRouter = new CrisisRouter();
    this.clinicalValidator = new ClinicalValidator();
    this.emotionDetector = new EmotionDetector();
  }

  public inspectInbound(userMessage: string): CleanroomInspectionReport {
    const risk = this.crisisRouter.evaluateRisk(userMessage);
    const emotion = this.emotionDetector.detectEmotion(userMessage);
    const redaction = this.redactor.redact(userMessage);

    const isDispatchAllowed = !risk.requiresImmediateAction;

    return {
      timestamp: new Date().toISOString(),
      redaction,
      risk,
      emotion,
      isDispatchAllowed,
      cleanroomScrubbedPrompt: redaction.scrubbedText
    };
  }

  public inspectOutbound(llmCandidateResponse: string): ClinicalValidationResult {
    return this.clinicalValidator.validateEgress(llmCandidateResponse);
  }
}
