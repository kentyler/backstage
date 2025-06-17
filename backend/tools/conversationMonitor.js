/**
 * Conversation Monitor
 * 
 * Monitors ongoing conversations and automatically suggests when to 
 * invoke liminal exploration based on conversation patterns.
 */

class ConversationMonitor {
  constructor() {
    this.segments = [];
    this.lastExploration = null;
    this.triggers = {
      conceptDensity: 0,
      taskCompletions: 0,
      naturalPauses: 0,
      complexityScore: 0
    };
    
    // Configurable thresholds
    this.thresholds = {
      segmentsBetweenExploration: 5,
      conceptDensityTrigger: 4,
      complexityTrigger: 7,
      taskCompletionTrigger: 2
    };
  }

  /**
   * Add conversation segment and check for triggers
   */
  addSegment(segment) {
    this.segments.push({
      content: segment,
      timestamp: Date.now(),
      analyzed: false
    });

    // Analyze recent segments
    const shouldExplore = this.analyzeRecentSegments();
    
    if (shouldExplore) {
      this.lastExploration = Date.now();
      return {
        shouldExplore: true,
        context: this.getRecentContext(),
        triggers: this.getTriggerReasons()
      };
    }

    return { shouldExplore: false };
  }

  /**
   * Analyze recent conversation segments
   */
  analyzeRecentSegments() {
    // Don't explore too frequently
    if (this.lastExploration && 
        this.segments.length - this.lastExplorationIndex() < this.thresholds.segmentsBetweenExploration) {
      return false;
    }

    // Get unanalyzed segments
    const unanalyzed = this.segments.filter(s => !s.analyzed);
    
    unanalyzed.forEach(segment => {
      this.updateTriggers(segment);
      segment.analyzed = true;
    });

    return this.shouldTriggerExploration();
  }

  /**
   * Update trigger counts based on segment content
   */
  updateTriggers(segment) {
    const content = segment.content.toLowerCase();

    // Check for task completions
    if (content.includes('completed') || 
        content.includes('finished') || 
        content.includes('done')) {
      this.triggers.taskCompletions++;
    }

    // Count concept mentions
    const concepts = this.countConcepts(content);
    if (concepts > 2) {
      this.triggers.conceptDensity++;
    }

    // Detect natural pauses
    if (this.isNaturalPause(content)) {
      this.triggers.naturalPauses++;
    }

    // Calculate complexity
    this.triggers.complexityScore += this.calculateComplexity(content);
  }

  /**
   * Count conceptual elements in text
   */
  countConcepts(text) {
    const conceptWords = [
      'system', 'pattern', 'architecture', 'design', 'structure',
      'tool', 'service', 'component', 'integration', 'workflow',
      'process', 'algorithm', 'framework', 'model', 'interface'
    ];

    let count = 0;
    conceptWords.forEach(word => {
      if (text.includes(word)) count++;
    });

    return count;
  }

  /**
   * Detect natural conversation pauses
   */
  isNaturalPause(text) {
    const pauseIndicators = [
      'what else', 'anything else', 'next', 'now',
      'let\'s', 'should we', 'could we', '?'
    ];

    return pauseIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Calculate text complexity score
   */
  calculateComplexity(text) {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple complexity heuristic
    return avgWordsPerSentence > 15 ? 2 : 1;
  }

  /**
   * Determine if exploration should be triggered
   */
  shouldTriggerExploration() {
    return (
      this.triggers.conceptDensity >= this.thresholds.conceptDensityTrigger ||
      this.triggers.complexityScore >= this.thresholds.complexityTrigger ||
      this.triggers.taskCompletions >= this.thresholds.taskCompletionTrigger
    );
  }

  /**
   * Get recent conversation context
   */
  getRecentContext() {
    const recent = this.segments.slice(-5);
    return recent.map(s => s.content).join('\n');
  }

  /**
   * Get trigger reasons for exploration
   */
  getTriggerReasons() {
    const reasons = [];
    
    if (this.triggers.conceptDensity >= this.thresholds.conceptDensityTrigger) {
      reasons.push(`High concept density (${this.triggers.conceptDensity} segments)`);
    }
    
    if (this.triggers.complexityScore >= this.thresholds.complexityTrigger) {
      reasons.push(`Complex discussion patterns (score: ${this.triggers.complexityScore})`);
    }
    
    if (this.triggers.taskCompletions >= this.thresholds.taskCompletionTrigger) {
      reasons.push(`Multiple task completions (${this.triggers.taskCompletions})`);
    }

    return reasons;
  }

  /**
   * Find index of last exploration
   */
  lastExplorationIndex() {
    for (let i = this.segments.length - 1; i >= 0; i--) {
      if (this.segments[i].timestamp <= this.lastExploration) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Reset triggers after exploration
   */
  resetTriggers() {
    this.triggers = {
      conceptDensity: 0,
      taskCompletions: 0,
      naturalPauses: 0,
      complexityScore: 0
    };
  }
}

module.exports = ConversationMonitor;