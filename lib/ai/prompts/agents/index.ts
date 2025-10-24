// Multi-Agent System Prompts for Consulting-Level Chart Generation

export { DATA_TRANSFORMER_AGENT_PROMPT } from './data-transformer'
export { CHART_ANALYST_AGENT_PROMPT } from './chart-analyst'
export { VIZ_STRATEGIST_AGENT_PROMPT } from './viz-strategist'
export { DESIGN_CONSULTANT_AGENT_PROMPT } from './design-consultant'
export { INSIGHT_NARRATOR_AGENT_PROMPT } from './insight-narrator'
export { HIGHCHARTS_GENERATOR_AGENT_PROMPT } from './highcharts-generator'

/**
 * AGENT ROLES:
 *
 * 0. DATA TRANSFORMER - Analyze structure and reshape data for optimal plotting
 * 1. CHART ANALYST - Strategic chart recommendations with data operations
 * 2. VIZ STRATEGIST - Static chart specifications for PowerPoint/PDF/PNG exports
 * 3. DESIGN CONSULTANT - Pixel-perfect design specs (colors, typography, spacing)
 * 4. HIGHCHARTS GENERATOR - Generate complete Highcharts config from all agent outputs
 *
 * These agents work sequentially to refine the visualization:
 * Data Transformation → Chart Analysis → Static Chart Specs → Pixel-Perfect Design → Highcharts Code Generation
 */
