/**
 * Liminal Explorer Service
 * 
 * Monitors conversation patterns and triggers liminal space exploration
 * when appropriate moments are detected.
 */

class LiminalExplorer {
  constructor() {
    this.conversationHistory = [];
    this.explorationThreshold = 3; // Number of related concepts before triggering
    this.patterns = {
      taskCompletion: [],
      conceptClusters: new Map(),
      pausePoints: [],
      unexploredConnections: []
    };
  }

  /**
   * Analyze conversation segment for liminal exploration opportunities
   */
  analyzeSegment(segment) {
    const triggers = {
      shouldExplore: false,
      reasons: [],
      themes: []
    };

    // Check for task completion without reflection
    if (segment.includes('completed') || segment.includes('finished')) {
      triggers.reasons.push('task-completion');
    }

    // Detect conceptual density
    const concepts = this.extractConcepts(segment);
    if (concepts.length >= this.explorationThreshold) {
      triggers.reasons.push('concept-density');
      triggers.themes.push(...concepts);
    }

    // Identify unexplored connections
    const connections = this.findUnexploredConnections(concepts);
    if (connections.length > 0) {
      triggers.reasons.push('unexplored-connections');
      triggers.themes.push(...connections);
    }

    triggers.shouldExplore = triggers.reasons.length > 0;
    return triggers;
  }

  /**
   * Extract key concepts from text
   */
  extractConcepts(text) {
    // Simple concept extraction - could be enhanced with NLP
    const conceptPatterns = [
      /\b(system|architecture|design|pattern|structure)\b/gi,
      /\b(process|flow|pipeline|workflow)\b/gi,
      /\b(integration|connection|relationship)\b/gi,
      /\b(tool|service|component|module)\b/gi
    ];

    const concepts = new Set();
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => concepts.add(match.toLowerCase()));
      }
    });

    return Array.from(concepts);
  }

  /**
   * Find connections between concepts that haven't been explicitly discussed
   */
  findUnexploredConnections(currentConcepts) {
    const connections = [];
    
    currentConcepts.forEach(concept => {
      const related = this.patterns.conceptClusters.get(concept) || [];
      related.forEach(relatedConcept => {
        if (!this.hasBeenExplored(concept, relatedConcept)) {
          connections.push(`${concept}-${relatedConcept}`);
        }
      });
    });

    return connections;
  }

  /**
   * Check if a connection has been explored
   */
  hasBeenExplored(concept1, concept2) {
    const key = [concept1, concept2].sort().join('-');
    return this.patterns.unexploredConnections.includes(key);
  }

  /**
   * Generate liminal exploration based on triggers
   */
  generateExploration(triggers) {
    const exploration = {
      observations: [],
      possibilities: [],
      themes: [],
      generativeThoughts: []
    };

    // Build exploration based on trigger reasons
    if (triggers.reasons.includes('task-completion')) {
      exploration.observations.push(
        "Task completed but implications unexplored",
        "Potential ripple effects on system architecture"
      );
    }

    if (triggers.reasons.includes('concept-density')) {
      exploration.possibilities.push(
        "Integration patterns between mentioned concepts",
        "Higher-order abstractions emerging from discussion"
      );
    }

    if (triggers.reasons.includes('unexplored-connections')) {
      exploration.themes.push(
        "Latent relationships between components",
        "Systemic patterns across implementation"
      );
    }

    // Add generative thoughts
    exploration.generativeThoughts.push(
      "Consider meta-tooling for conversation enhancement",
      "Explore recursive self-improvement patterns"
    );

    return exploration;
  }

  /**
   * Main exploration trigger
   */
  shouldTriggerExploration(conversationContext) {
    const analysis = this.analyzeSegment(conversationContext);
    
    if (analysis.shouldExplore) {
      return {
        trigger: true,
        exploration: this.generateExploration(analysis)
      };
    }

    return { trigger: false };
  }
}

module.exports = LiminalExplorer;