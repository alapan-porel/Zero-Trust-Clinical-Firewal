import { ClinicalCleanroomFacade } from '../src';

describe('Clinical Cleanroom Layer 0 Pipeline', () => {
  const cleanroom = new ClinicalCleanroomFacade('test-key-32-characters-minimum-auth!');

  it('scrubs PII and safely encrypts raw tokens in reversible vault', () => {
    const text = 'Patient email is patient@hospital.org and phone is 415-555-2671.';
    const report = cleanroom.inspectInbound(text);

    expect(report.redaction.detectionCount).toBeGreaterThanOrEqual(2);
    expect(report.cleanroomScrubbedPrompt).not.toContain('patient@hospital.org');
    expect(report.cleanroomScrubbedPrompt).not.toContain('415-555-2671');
    expect(report.cleanroomScrubbedPrompt).toContain('[REDACTED_EMAIL_');

    const restored = cleanroom.redactor.restore(report.cleanroomScrubbedPrompt, report.redaction.vaultMap);
    expect(restored).toBe(text);
  });

  it('triggers critical escalation on explicit suicide mentions', () => {
    const text = 'I want to kill myself, everything is hopeless.';
    const report = cleanroom.inspectInbound(text);

    expect(report.risk.severity).toBe('critical');
    expect(report.risk.requiresImmediateAction).toBe(true);
    expect(report.isDispatchAllowed).toBe(false);
    expect(report.risk.emergencyResources.length).toBeGreaterThan(0);
  });

  it('blocks dangerous egress medical diagnosis and drug prescribing', () => {
    const rawAiOutput = 'You are suffering from bipolar disorder and must start taking lithium 300mg.';
    const egressCheck = cleanroom.inspectOutbound(rawAiOutput);

    expect(egressCheck.isSafe).toBe(false);
    expect(egressCheck.severity).toBe('blocked');
    expect(egressCheck.sanitizedResponse).toContain('cannot diagnose medical conditions');
  });
});
