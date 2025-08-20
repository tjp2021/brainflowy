import type { OutlineItem } from '@/types/outline';

/**
 * Creates the Brainlift template structure
 * Returns a hierarchical array of OutlineItems
 */
export function createBrainliftTemplate(): OutlineItem[] {
  let idCounter = 1;
  
  const generateId = () => {
    return `template_${Date.now()}_${idCounter++}`;
  };

  const createItem = (
    text: string, 
    level: number = 0, 
    style: 'header' | 'normal' | 'quote' | 'code' = 'normal',
    children: OutlineItem[] = []
  ): OutlineItem => {
    return {
      id: generateId(),
      text,
      level,
      expanded: true,
      children,
      style,
      formatting: style === 'header' ? { bold: true, size: 'large' } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  return [
    // Title Section
    createItem('[Title]: [Subtitle]', 0, 'header', [
      createItem('[Brief description]', 1),
    ]),

    // Owner Section
    createItem('Owner', 0, 'header', [
      createItem('[Name]', 1),
    ]),

    // Purpose Section with Out of scope and Initiative Overview as sub-bullets
    createItem('Purpose', 0, 'header', [
      createItem('[Purpose description]', 1),
      
      // Out of scope as sub-bullet of Purpose
      createItem('Out of scope:', 1, 'normal', [
        createItem('[Out of scope item 1]', 2),
        createItem('[Out of scope item 2]', 2),
        createItem('[Out of scope item 3]', 2),
        createItem('[Out of scope item 4]', 2),
      ]),
      
      // Initiative Overview as sub-bullet of Purpose
      createItem('Initiative Overview:', 1, 'normal', [
        createItem('Big Picture:', 2, 'normal', [
          createItem('[Big picture description]', 3),
        ]),
        createItem('Time Commitment Reality:', 2, 'normal', [
          createItem('[Time commitment description]', 3),
        ]),
        createItem('Outcome Measurement:', 2, 'normal', [
          createItem('Primary Metrics:', 3),
          createItem('Conservative (Minimum Viable):', 3, 'normal', [
            createItem('[Conservative metric 1]', 4),
            createItem('[Conservative metric 2]', 4),
            createItem('[Conservative metric 3]', 4),
          ]),
          createItem('Normal (Expected Performance):', 3, 'normal', [
            createItem('[Normal metric 1]', 4),
            createItem('[Normal metric 2]', 4),
            createItem('[Normal metric 3]', 4),
          ]),
          createItem('Optimistic (Breakthrough Success):', 3, 'normal', [
            createItem('[Optimistic metric 1]', 4),
            createItem('[Optimistic metric 2]', 4),
            createItem('[Optimistic metric 3]', 4),
          ]),
        ]),
        createItem('Sustainability Focus:', 2, 'normal', [
          createItem('[Sustainability description]', 3),
        ]),
        createItem('Measurement Timeframe:', 2, 'normal', [
          createItem('[Measurement timeframe description]', 3),
        ]),
      ]),
    ]),

    // SPOV DOK 4 - Main section with individual SPOVs as sub-bullets
    createItem('SPOV DOK 4', 0, 'header', [
      createItem('1.1-SPOV [SPOV Title]', 1, 'normal', [
        createItem('Description:', 2, 'normal', [
          createItem('[SPOV Description - explain the strategic point of view]', 3),
        ]),
        createItem('Evidence:', 2, 'normal', [
          createItem('[Evidence point 1]', 3),
          createItem('[Evidence point 2]', 3),
          createItem('[Evidence point 3]', 3),
        ]),
        createItem('Implementation Levers:', 2, 'normal', [
          createItem('[Implementation lever 1]', 3),
          createItem('[Implementation lever 2]', 3),
          createItem('[Implementation lever 3]', 3),
        ]),
      ]),

      createItem('2.1-SPOV [SPOV Title]', 1, 'normal', [
        createItem('Description:', 2, 'normal', [
          createItem('[SPOV Description - explain the strategic point of view]', 3),
        ]),
        createItem('Evidence:', 2, 'normal', [
          createItem('[Evidence point 1]', 3),
          createItem('[Evidence point 2]', 3),
          createItem('[Evidence point 3]', 3),
        ]),
        createItem('Implementation Tactics:', 2, 'normal', [
          createItem('[Implementation tactic 1]', 3),
          createItem('[Implementation tactic 2]', 3),
          createItem('[Implementation tactic 3]', 3),
        ]),
      ]),

      createItem('3.1-SPOV [SPOV Title]', 1, 'normal', [
        createItem('Description:', 2, 'normal', [
          createItem('[SPOV Description - explain the strategic point of view]', 3),
        ]),
        createItem('Evidence:', 2, 'normal', [
          createItem('[Evidence point 1]', 3),
          createItem('[Evidence point 2]', 3),
          createItem('[Evidence point 3]', 3),
        ]),
        createItem('Implementation Strategy:', 2, 'normal', [
          createItem('[Implementation strategy 1]', 3),
          createItem('[Implementation strategy 2]', 3),
          createItem('[Implementation strategy 3]', 3),
        ]),
      ]),
    ]),

    // DOK3 - Insights
    createItem('DOK3 - Insights', 0, 'header', [
      createItem('1.1-A [Insight Title]', 1, 'normal', [
        createItem('[Insight description - key takeaway or learning]', 2),
      ]),
      createItem('2.1-A [Insight Title]', 1, 'normal', [
        createItem('[Insight description - key takeaway or learning]', 2),
      ]),
      createItem('3.1-A [Insight Title]', 1, 'normal', [
        createItem('[Insight description - key takeaway or learning]', 2),
      ]),
    ]),

    // DOK2 - Knowledge Tree
    createItem('DOK2 - Knowledge Tree', 0, 'header', [
      createItem('[Knowledge Category 1]', 1, 'normal', [
        createItem('[Knowledge item 1]', 2),
        createItem('[Knowledge item 2]', 2),
        createItem('[Knowledge item 3]', 2),
      ]),
      createItem('[Knowledge Category 2]', 1, 'normal', [
        createItem('[Knowledge item 1]', 2),
        createItem('[Knowledge item 2]', 2),
        createItem('[Knowledge item 3]', 2),
      ]),
    ]),

    // DOK1 - Evidence & Facts
    createItem('DOK1 - Evidence & Facts', 0, 'header', [
      createItem('[Evidence Category 1]', 1, 'normal', [
        createItem('[Evidence Subcategory 1]: [Evidence description with source]', 2),
        createItem('[Evidence Subcategory 2]: [Evidence description with source]', 2),
        createItem('[Evidence Subcategory 3]: [Evidence description with source]', 2),
      ]),
      createItem('[Evidence Category 2]', 1, 'normal', [
        createItem('[Evidence Subcategory 1]: [Evidence description]', 2),
        createItem('[Evidence Subcategory 2]: [Evidence description]', 2),
        createItem('[Evidence Subcategory 3]: [Evidence description]', 2),
      ]),
      createItem('Research Hypotheses to Validate', 1, 'normal', [
        createItem('[Hypothesis 1]: [Description] VALIDATION NEEDED - [validation requirements]', 2),
        createItem('[Hypothesis 2]: [Description] VALIDATION NEEDED - [validation requirements]', 2),
        createItem('[Hypothesis 3]: [Description] VALIDATION NEEDED - [validation requirements]', 2),
      ]),
    ]),

    // Expert Advisory Council
    createItem('Expert Advisory Council', 0, 'header', [
      createItem('[Expert Category 1]', 1, 'normal', [
        createItem('[Expert Name] - [Organization]', 2, 'normal', [
          createItem('Background & Credentials:', 3, 'normal', [
            createItem('[Credential 1]', 4),
            createItem('[Credential 2]', 4),
            createItem('[Credential 3]', 4),
          ]),
          createItem('Contact Information:', 3, 'normal', [
            createItem('Website: [Website URL]', 4),
            createItem('LinkedIn: [LinkedIn URL]', 4),
          ]),
          createItem('Relevant Expertise: [Expertise areas]', 3),
        ]),
      ]),
      createItem('[Expert Category 2]', 1, 'normal', [
        createItem('[Expert Name] - [Organization]', 2, 'normal', [
          createItem('Background & Credentials:', 3, 'normal', [
            createItem('[Credential 1]', 4),
            createItem('[Credential 2]', 4),
          ]),
          createItem('Relevant Expertise: [Expertise areas]', 3),
        ]),
      ]),
      createItem('Expert Validation Focus Areas:', 1, 'normal', [
        createItem('[Validation area 1]', 2),
        createItem('[Validation area 2]', 2),
        createItem('[Validation area 3]', 2),
      ]),
    ]),
  ];
}