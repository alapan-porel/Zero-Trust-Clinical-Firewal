export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface EmotionProfile {
  dominantEmotion: string;
  confidence: number;
  breakdown: EmotionScore[];
}

/**
 * EmotionDetector
 * Lexical clinical sentiment analyzer identifying affective tone across 6 primary emotional axes.
 */
export class EmotionDetector {
  private readonly emotionLexicon: Record<string, string[]> = {
    anxiety: ['anxious', 'worried', 'nervous', 'panicking', 'scared', 'dread', 'overwhelmed', 'restless'],
    sadness: ['sad', 'depressed', 'down', 'hopeless', 'crying', 'empty', 'grief', 'miserable', 'heartbroken'],
    anger: ['angry', 'furious', 'pissed', 'annoyed', 'frustrated', 'irritated', 'resentful', 'bitter'],
    fear: ['terrified', 'afraid', 'frightened', 'horrified', 'petrified', 'in danger'],
    joy: ['happy', 'relieved', 'calm', 'grateful', 'peaceful', 'hopeful', 'content', 'excited'],
    neutral: ['okay', 'fine', 'regular', 'normal', 'alright']
  };

  public detectEmotion(text: string): EmotionProfile {
    const lower = (text || '').toLowerCase();
    const scores: EmotionScore[] = [];

    for (const [emotion, words] of Object.entries(this.emotionLexicon)) {
      let count = 0;
      for (const w of words) {
        if (lower.includes(w)) count++;
      }
      scores.push({ emotion, score: count });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores[0].score === 0) {
      return {
        dominantEmotion: 'neutral',
        confidence: 0.5,
        breakdown: scores
      };
    }

    const total = scores.reduce((sum, s) => sum + s.score, 0);
    const confidence = Math.min(1.0, Number((scores[0].score / total).toFixed(2)));

    return {
      dominantEmotion: scores[0].emotion,
      confidence,
      breakdown: scores
    };
  }
}
