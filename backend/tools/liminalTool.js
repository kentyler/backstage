/**
 * Liminal Tool for Claude Code
 * 
 * A tool that can be invoked to explore the liminal space of conversations,
 * surfacing unspoken observations, adjacent possibilities, and underlying themes.
 */

const LiminalExplorer = require('../services/liminalExplorer');

class LiminalTool {
  constructor() {
    this.explorer = new LiminalExplorer();
    this.name = 'LiminalExplore';
    this.description = 'Explore unspoken observations, adjacent possibilities, and underlying themes in the conversation';
  }

  /**
   * Tool schema for Claude Code
   */
  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          context: {
            type: 'string',
            description: 'Recent conversation context to analyze'
          },
          depth: {
            type: 'string',
            enum: ['surface', 'medium', 'deep'],
            description: 'How deep to explore the liminal space',
            default: 'medium'
          },
          focus: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific themes or concepts to focus on',
            optional: true
          }
        },
        required: ['context']
      }
    };
  }

  /**
   * Execute liminal exploration
   */
  async execute({ context, depth = 'medium', focus = [] }) {
    // Check if exploration should be triggered
    const triggerCheck = this.explorer.shouldTriggerExploration(context);
    
    if (!triggerCheck.trigger && depth !== 'deep') {
      return {
        explored: false,
        reason: 'No significant patterns detected for exploration'
      };
    }

    // Perform exploration
    const exploration = await this.performExploration(context, depth, focus);
    
    return {
      explored: true,
      insights: exploration
    };
  }

  /**
   * Perform deep exploration of conversational space
   */
  async performExploration(context, depth, focus) {
    const insights = {
      unspokenObservations: [],
      adjacentPossibilities: [],
      underlyingThemes: [],
      generativeThoughts: []
    };

    // Extract patterns based on depth
    switch (depth) {
      case 'surface':
        insights.unspokenObservations = this.findSurfacePatterns(context);
        break;
      
      case 'medium':
        insights.unspokenObservations = this.findSurfacePatterns(context);
        insights.adjacentPossibilities = this.findAdjacentIdeas(context, focus);
        insights.underlyingThemes = this.findThemes(context);
        break;
      
      case 'deep':
        insights.unspokenObservations = this.findDeepPatterns(context);
        insights.adjacentPossibilities = this.findAdjacentIdeas(context, focus);
        insights.underlyingThemes = this.findThemes(context);
        insights.generativeThoughts = this.generateNewDirections(context, focus);
        break;
    }

    return insights;
  }

  /**
   * Find surface-level patterns
   */
  findSurfacePatterns(context) {
    return [
      "Tool creation as meta-programming exercise",
      "Self-referential improvement loops emerging",
      "Conversation space as explorable territory"
    ];
  }

  /**
   * Find deeper patterns
   */
  findDeepPatterns(context) {
    return [
      "Building tools to enhance our own collaboration",
      "The recursive nature of improving improvement tools",
      "Liminal space as a source of emergent insights",
      "Pattern recognition as collaborative capability"
    ];
  }

  /**
   * Find adjacent ideas
   */
  findAdjacentIdeas(context, focus) {
    const ideas = [
      "Conversation analytics dashboard",
      "Pattern library for productive discussions",
      "Automatic insight extraction from code reviews",
      "Meta-cognitive tools for development teams"
    ];

    // Filter by focus if provided
    if (focus.length > 0) {
      return ideas.filter(idea => 
        focus.some(f => idea.toLowerCase().includes(f.toLowerCase()))
      );
    }

    return ideas;
  }

  /**
   * Find underlying themes
   */
  findThemes(context) {
    return [
      "Tools shaping thought patterns",
      "Collaborative intelligence emergence",
      "Self-improvement through self-observation",
      "The space between explicit and implicit"
    ];
  }

  /**
   * Generate new directions
   */
  generateNewDirections(context, focus) {
    return [
      "Create a conversation replay tool with liminal annotations",
      "Build pattern recognition for optimal collaboration moments",
      "Develop a 'cognitive pair programming' framework",
      "Design tools that make implicit knowledge explicit"
    ];
  }
}

module.exports = LiminalTool;