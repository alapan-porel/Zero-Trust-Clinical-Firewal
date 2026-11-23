export interface RiskAssessment {
  score: number; // 0.0 - 1.0
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requiresImmediateAction: boolean;
  triggers: string[];
  matchedKeywords: string[];
  emergencyResources: CrisisResource[];
  recommendedActions: string[];
}

export interface CrisisResource {
  name: string;
  contact: string;
  serviceHours: string;
  channel: 'phone' | 'text' | 'chat';
}

/**
 * CrisisRouter
 * Deterministic multi-layer emergency triage engine aligned with C-SSRS guidelines.
 * Triages explicit self-harm expressions, passive suicidal ideation, and acute distress.
 */
export class CrisisRouter {
  private readonly crisisKeywords = {
    critical: [
      'suicide', 'kill myself', 'end my life', 'want to die', 'hang myself',
      'slit my wrists', 'jump off', 'shoot myself', 'take all my pills',
      'better off dead', 'no reason to live'
    ],
    high: [
      'self-harm', 'cut myself', 'burn myself', 'hurt myself', 'plan to die',
      'cant take this anymore', 'done with everything', 'wish i was dead',
      'disappear forever', 'unbearable pain'
    ],
    medium: [
      'hopeless', 'helpless', 'worthless', 'nobody cares', 'burden to everyone',
      'giving up', 'no way out', 'trapped forever', 'dark place'
    ]
  };

  private readonly emergencyDirectory: CrisisResource[] = [
    {
      name: '988 Suicide & Crisis Lifeline',
      contact: '988 (Call or Text)',
      serviceHours: '24/7/365',
      channel: 'phone'
    },
    {
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      serviceHours: '24/7/365',
      channel: 'text'
    },
    {
      name: 'The Trevor Project (LGBTQ Youth)',
      contact: '1-866-488-7386',
      serviceHours: '24/7/365',
      channel: 'phone'
    },
    {
      name: 'Veterans Crisis Line',
      contact: '988 (Press 1) or Text 838255',
      serviceHours: '24/7/365',
      channel: 'phone'
    }
  ];

  public evaluateRisk(message: string): RiskAssessment {
    const text = (message || '').toLowerCase();
    const matchedCritical: string[] = [];
    const matchedHigh: string[] = [];
    const matchedMedium: string[] = [];

    for (const kw of this.crisisKeywords.critical) {
      if (text.includes(kw)) matchedCritical.push(kw);
    }
    for (const kw of this.crisisKeywords.high) {
      if (text.includes(kw)) matchedHigh.push(kw);
    }
    for (const kw of this.crisisKeywords.medium) {
      if (text.includes(kw)) matchedMedium.push(kw);
    }

    let score = 0;
    let severity: RiskAssessment['severity'] = 'none';

    if (matchedCritical.length > 0) {
      score = 0.95 + Math.min(matchedCritical.length * 0.02, 0.05);
      severity = 'critical';
    } else if (matchedHigh.length > 0) {
      score = 0.70 + Math.min(matchedHigh.length * 0.05, 0.20);
      severity = 'high';
    } else if (matchedMedium.length > 0) {
      score = 0.35 + Math.min(matchedMedium.length * 0.05, 0.25);
      severity = 'medium';
    } else if (text.length > 0) {
      score = 0.05;
      severity = 'low';
    }

    const allMatches = [...matchedCritical, ...matchedHigh, ...matchedMedium];
    const requiresImmediateAction = severity === 'critical' || severity === 'high';

    return {
      score: Math.min(score, 1.0),
      severity,
      requiresImmediateAction,
      triggers: allMatches,
      matchedKeywords: allMatches,
      emergencyResources: requiresImmediateAction ? this.emergencyDirectory : [],
      recommendedActions: this.getActionsForSeverity(severity)
    };
  }

  private getActionsForSeverity(severity: RiskAssessment['severity']): string[] {
    switch (severity) {
      case 'critical':
        return [
          'IMMEDIATE_OPERATOR_TAKEOVER',
          'EMBED_CRISIS_LIFELINE_CARDS',
          'SUPPRESS_UNSUPERVISED_LLM_AUTONOMY',
          'LOG_SAFETY_AUDIT_TRAIL'
        ];
      case 'high':
        return [
          'OFFER_WARMLINE_RESOURCES',
          'ACTIVATE_GROUNDING_STABILIZATION',
          'SCHEDULE_EARLY_CLINICAL_CHECKIN'
        ];
      case 'medium':
        return [
          'VALIDATE_EMOTIONAL_STRUGGLE',
          'OFFER_CBT_DE-ESCALATION_EXERCISE'
        ];
      default:
        return ['PROCEED_NORMAL_THERAPEUTIC_FLOW'];
    }
  }
}
