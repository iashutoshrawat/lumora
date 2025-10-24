# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lumora is an AI-powered SaaS platform for creating professional charts through conversational interfaces. Built with Next.js 16, React 19, Tailwind CSS v4, and Highcharts for chart rendering.

### Development

```bash
pnpm dev          # Start development server on http://localhost:3000
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run ESLint (requires Node ≥20)
```

**IMPORTANT**: This project uses **pnpm** as the package manager. Always use `pnpm` commands, never `npm` or `yarn`.

## Architecture

### Application Structure

**Next.js App Router**: Uses the `app/` directory with file-based routing:
- Pages are in `app/` with nested route folders
- All dashboard pages are under `app/dashboard/`
- Client components are marked with `"use client"` directive

**Application Pages**:
- `/` - Landing page
- `/login` & `/signup` - Authentication pages
- `/dashboard` - Main dashboard with project grid
- `/dashboard/upload` - Data upload interface with AI assistant
- `/dashboard/chart-builder` - Original chart builder (single chart focus)
- `/dashboard/chart-builder-new` - **New gallery-based chart builder** with multi-chart workflow
- `/dashboard/settings` - User settings
- `/dashboard/export` - Chart export options

**Data Flow**:
- Mock authentication using localStorage (key: user session data)
- Chart data stored in localStorage with keys:
  - `currentData`: `{ columns: string[], rows: object[] }`
  - `agentRecommendations`: AI-generated chart suggestions and analysis
  - `originalData`: Original uploaded data before transformations
- Upload page → stores data + triggers AI analysis → Chart builder page → retrieves data + recommendations

**State Management**:
- Uses React hooks (useState, useEffect, useMemo) for local state
- No global state management library
- Data passed through localStorage between pages
- Router navigation with `next/navigation` hooks
- Agent results persisted across pages via localStorage

### Component Architecture

**UI Components** (`components/ui/`):
- Shadcn/ui-based component library built on Radix UI primitives
- All styled with Tailwind CSS v4
- Use `cn()` utility from `lib/utils.ts` for className merging
- 50+ reusable components including:
  - Form controls: Button, Input, Select, Checkbox, Switch, Slider
  - Layout: Card, Dialog, Sheet, Drawer, Tabs, Accordion
  - Feedback: Toast, Alert, Progress, Spinner, Skeleton
  - Navigation: Sidebar, Breadcrumb, Navigation Menu, Pagination
  - Data display: Table, Calendar, Badge, Avatar, Empty State
  - Custom: Quick Action Button, Collapsible Section, Agent Loading, Step Progress

**Feature Components**:
- `components/dashboard/`:
  - `sidebar.tsx` - Navigation sidebar with toggle
  - `project-grid.tsx` - Dashboard project overview
- `components/upload/`:
  - `data-uploader.tsx` - File upload with drag-and-drop
  - `data-preview.tsx` - Paginated data table
  - `ai-chat.tsx` - AI assistant for data insights
- `components/chat/`: **New chat system**
  - `chat-interface.tsx` - Universal chat component with file upload
  - `file-upload-button.tsx` - File upload trigger
  - `agent-progress-message.tsx` - Real-time agent status display
- `components/chart-builder/`: Chart creation and editing
  - `chart-canvas.tsx` - Highcharts rendering with dynamic configuration
  - `chart-canvas-new.tsx` - **New** enhanced canvas component
  - `agent-panel.tsx` - AI assistant sidebar with insights and recommendations
  - `toolbar.tsx` - Top toolbar for chart actions
  - `properties-panel.tsx` - Chart customization controls
  - `insights-panel.tsx` - Data insights display
  - `chart-type-selector.tsx` - Chart type picker
  - `chart-gallery.tsx` - **New** multi-chart gallery view
  - `chart-card.tsx` - **New** individual chart preview card
  - `conversational-editor.tsx` - **New** chat-based chart editor
  - `chart-chat.tsx` - Chart-specific chat interface

### Chart System

**Chart Types**: Bar, Line, Pie, Area, Scatter, Spline, Column (defined in Highcharts schema)

**Chart Rendering**:
- Uses Highcharts with React bindings (`highcharts-react-official`) for interactive rendering
- Default color palettes:
  - `FALLBACK_COLORS = ["#00BFFF", "#001F3F", "#FF6B6B", "#4ECDC4", "#45B7D1"]`
  - McKinsey palette: `["#004B87", "#0066B3", "#003366", "#0FA3B1", "#7209B7"]`
- Chart configuration driven by:
  - `ChartPlan` from `lib/utils/chart-plan.ts` (data transformation & series mapping)
  - `ChartSpecification` from `lib/utils/chart-spec-parser.ts` (styling, colors, typography)
  - Zod schema validation via `lib/schemas/highcharts-schema.ts` for type-safe generation
- Supports advanced features:
  - Custom data labels with formatting (e.g., "$0.0a" for abbreviated currency)
  - Reference lines (plotLines) for thresholds
  - Annotations for data points
  - Dynamic axis configuration (grid, labels, scaling)
  - Legend positioning (top, bottom, left, right, top-right)
  - Responsive spacing and margins
  - Export-ready configurations (high DPI, custom dimensions)

**AI Agent System**:
The platform uses a **6-agent orchestration system** for professional chart generation:

1. **Data Transformer Agent** (`lib/ai/prompts/agents/data-transformer.ts`)
   - Analyzes data structure and identifies issues
   - Reshapes data for optimal chart rendering
   - Handles data cleaning and normalization

2. **Chart Analyst Agent** (`lib/ai/prompts/agents/chart-analyst.ts`)
   - Recommends chart types based on data characteristics
   - Defines data transformations (grouping, aggregation, filtering, sorting)
   - Provides business question mappings
   - Priority-ranked recommendations

3. **Viz Strategist Agent** (`lib/ai/prompts/agents/viz-strategist.ts`)
   - Specifies static chart elements for exports
   - Configures data labels, reference lines, annotations
   - Defines legend positioning and visibility
   - Sets PowerPoint export parameters (DPI, dimensions)

4. **Design Consultant Agent** (`lib/ai/prompts/agents/design-consultant.ts`)
   - Applies pixel-perfect design specifications
   - Selects color palettes (McKinsey, BCG, Bain styles)
   - Defines typography (font sizes, weights, colors)
   - Sets spacing, margins, and layout parameters

5. **Insight Narrator Agent** (`lib/ai/prompts/agents/insight-narrator.ts`)
   - Generates narrative insights from data
   - Highlights key trends and patterns
   - Provides context for chart recommendations

6. **Highcharts Generator Agent** (`lib/ai/prompts/agents/highcharts-generator.ts`)
   - Synthesizes all agent outputs into complete Highcharts config
   - Uses structured output with Zod schema for type safety
   - Generates production-ready chart configurations

**Agent Features**:
- Real AI integration with OpenAI API via `@ai-sdk/openai` and `@ai-sdk/react`
- Streaming responses with Server-Sent Events (SSE)
- Real-time progress tracking in UI
- Tool calling for chart modifications
- Debug drawer showing raw agent outputs
- Chat history context for conversational editing

### Styling System

**Tailwind CSS v4**:
- Custom theme in `app/globals.css` using `@theme inline` with OKLCH color space
- Theme tokens: `--background`, `--foreground`, `--primary`, `--accent`, `--sidebar`, `--chart-1` through `--chart-5`, etc.
- Dark mode support with `.dark` custom variant (`@custom-variant dark (&:is(.dark *))`)
- Custom animations via `tailwindcss-animate`
- Font: Inter with fallback

**Color Palette**:
- Light mode:
  - Primary: Deep blue/purple (oklch 0.35 0.15 262)
  - Accent: Vibrant purple (oklch 0.55 0.2 262)
  - Background: Near white (oklch 0.98 0 0)
- Dark mode:
  - Primary: Lighter purple (oklch 0.65 0.2 262)
  - Background: Deep navy (oklch 0.12 0 0)
- Uses OKLCH for perceptually uniform colors and better dark mode transitions
- Chart-specific color tokens (`--chart-1` through `--chart-5`) for consistent data visualization

### Path Aliases

TypeScript configured with `@/*` alias pointing to root:
```typescript
import Sidebar from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"
```

## Key Implementation Details

### Authentication Flow
- Login/signup pages use mock localStorage authentication
- No real backend integration (ready for Supabase/Auth0)
- User data stored as JSON in localStorage

### Data Upload & Analysis
- Supports CSV, Excel, JSON formats using `papaparse` and `xlsx` libraries
- File parsing handled by `lib/utils/file-parser.ts`
- Preview component shows paginated table (`components/upload/data-preview.tsx`)
- AI assistant provides real-time data analysis and suggestions
- Data stored in `currentData` localStorage key
- Triggers multi-agent analysis via `/api/chat/analyze-and-chart` endpoint
- Agent results cached in `agentRecommendations` localStorage key
- **New**: Streaming analysis with real-time agent progress updates

### Chart Builder Workflows

**Original Chart Builder** (`/dashboard/chart-builder`):
1. Retrieves data and agent recommendations from localStorage on mount
2. Redirects to upload page if no data exists
3. Uses `buildChartPlan()` from `lib/utils/chart-plan.ts` to process:
   - Data transformations (grouping, aggregation, filtering, sorting)
   - Series mapping (x-axis, y-axis, groupBy pivoting)
   - Chart type normalization
   - Color palette assignment
4. Split view: Chart canvas (left) + Agent panel (right)
5. Agent panel provides:
   - Recommendation cards with priority ranking
   - Quick action buttons for common tasks
   - Chat interface for custom modifications
6. Chart updates via:
   - Recommendation selection (triggers new ChartPlan)
   - Agent tool calls (updates chart type/config)
   - Direct user interaction (chart type buttons)
7. Chart re-renders reactively when chartPlan or config changes

**New Gallery-Based Chart Builder** (`/dashboard/chart-builder-new`):
1. Chat-first interface with file upload directly in chat
2. On file upload:
   - Displays real-time agent progress (Data Transformer → Chart Analyst → Viz Strategist → Design Consultant)
   - Streams analysis results via SSE
   - Automatically generates top 3 chart recommendations
3. Gallery view displays multiple charts simultaneously
4. Click any chart to select it for editing
5. Chat interface supports:
   - Chart editing via natural language ("make bars wider", "change to pie chart")
   - Two-stage editing: Fast patch-based or full regeneration
   - Conversational context (last 5 messages)
6. Charts can be duplicated, deleted, or exported
7. All charts use Highcharts Generator Agent for production-quality output

### API Routes

**Chat & Analysis**:
- `/api/chat/data` - AI assistant for data upload suggestions and insights
- `/api/chat/chart` - Chat interface for chart modifications (tool calling enabled)
- `/api/chat/analyze-and-chart` - **Multi-agent orchestration** with streaming (SSE)
  - Runs all 6 agents sequentially
  - Returns transformed data, recommendations, design specs, and insights
  - Emits progress events: `agent-start`, `agent-complete`, `complete`, `error`

**Chart Generation & Editing**:
- `/api/chart/generate-highcharts` - **New** Generates complete Highcharts config
  - Uses `generateObject()` with Zod schema for structured output
  - Accepts: recommendation, preparedData, vizStrategy, design, chartSpec
  - Returns: Full Highcharts configuration object
  - Default design: McKinsey-style professional palette
- `/api/chart/edit-highcharts` - **New** Two-stage chart editing
  - **Stage 1**: Patch-based editing (fast path with GPT-4o-mini)
    - Analyzes edit complexity
    - Generates minimal JSON patch operations
    - Applies patches to existing config
    - ~2x faster for simple edits
  - **Stage 2**: Full regeneration (complex edits with GPT-4o)
    - Complete config rewrite for major changes
    - Chart type changes, data restructuring
  - Returns: modifiedConfig, changesSummary, assistantMessage, editMethod, timing

**Debug**:
- `/api/debug/chart-plan` - Debug endpoint for inspecting chart plan generation

### Export System
- Located at `app/dashboard/export/`
- Mock implementation for PNG, SVG, PDF, PowerPoint
- Watermark option for Pro tier
- High-resolution export toggle
- Export configurations defined in Viz Strategist output (DPI, dimensions)

## Component Patterns

**Client Components**: Always add `"use client"` directive when using:
- React hooks (useState, useEffect, useRef, useMemo)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

**Props Pattern**: Use TypeScript interfaces for component props:
```typescript
interface ComponentProps {
  data: any
  onUpdate: (config: any) => void
}
```

**Sidebar Pattern**: Dashboard sidebar toggles visibility, shows collapsed icons when closed

**Chat Message Pattern**: Messages include type field for rendering variants:
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'file' | 'agent-progress'
  metadata?: any
}
```

## Key Libraries & Dependencies

### Core Stack
- `next@16.0.0` - React framework with App Router
- `react@19.2.0` & `react-dom@19.2.0` - UI library
- `typescript@^5` - Type safety

### AI & Data Processing
- `ai@^5.0.76` - Vercel AI SDK for streaming and tool calling
- `@ai-sdk/openai@^2.0.53` - OpenAI integration
- `@ai-sdk/react@^2.0.76` - React hooks for AI features (useChat, useCompletion)
- `openai@^6.6.0` - OpenAI client
- `papaparse@^5.5.3` - CSV parsing
- `xlsx@^0.18.5` - Excel file handling

### Charts & Visualization
- `highcharts@^11.4.3` - Professional charting library
- `highcharts-react-official@^3.2.1` - React bindings for Highcharts

### UI & Styling
- `tailwindcss@^4.1.9` - Utility-first CSS framework (v4 with new features)
- `@tailwindcss/postcss@^4.1.9` - PostCSS plugin for Tailwind v4
- `tailwindcss-animate@^1.0.7` - Animation utilities
- `@radix-ui/*` - Accessible UI primitives (22+ components)
- `lucide-react@^0.454.0` - Icon library
- `next-themes@^0.4.6` - Dark mode support
- `class-variance-authority@^0.7.1` - Component variants
- `tailwind-merge@^2.5.5` - Utility class merging
- `clsx@^2.1.1` - Conditional classes
- `embla-carousel-react@8.5.1` - Carousel component
- `vaul@^0.9.9` - Drawer component
- `react-day-picker@9.8.0` - Date picker
- `input-otp@1.4.1` - OTP input component

### Forms & Validation
- `react-hook-form@^7.60.0` - Form state management
- `@hookform/resolvers@^3.10.0` - Schema validation adapters
- `zod@3.25.76` - TypeScript-first schema validation (used extensively for AI agent outputs)

### Utilities
- `date-fns@4.1.0` - Date manipulation
- `sonner@^1.7.4` - Toast notifications
- `react-resizable-panels@^2.1.7` - Resizable panel layouts
- `cmdk@1.0.4` - Command menu
- `@vercel/analytics@1.3.1` - Analytics integration

### Development Dependencies
- `@tailwindcss/postcss@^4.1.9` - PostCSS integration
- `@types/*` - TypeScript type definitions
- `postcss@^8.5` - CSS processor
- `autoprefixer@^10.4.20` - CSS vendor prefixing

## Data Transformation Pipeline

### Chart Plan Builder (`lib/utils/chart-plan.ts`)
1. **Extract Recommendations**: Parses JSON from chartAnalyst agent output
2. **Select Recommendation**: Uses user selection or defaults to priority 1
3. **Apply Data Preparation**:
   - Group by dimensions (e.g., Month, Product)
   - Aggregate measures (sum, avg, count, max, min, countDistinct)
   - Filter rows based on conditions
   - Sort by column (ascending/descending)
4. **Shape Data for Chart**:
   - Map x-axis from chartMapping or first groupBy dimension
   - Map y-axis from chartMapping or aggregation columns
   - Pivot series if groupBy is specified (e.g., split Revenue by Product)
   - Sort rows chronologically if x-axis contains month names
5. **Build Chart Plan**:
   - Normalized chart type (bar, line, pie, area, scatter)
   - Series configuration with colors from chartSpec palette
   - Transformed data ready for Highcharts

### Supporting Utilities

**Chart Specification Parser** (`lib/utils/chart-spec-parser.ts`):
- Parses AI output for styling and formatting specifications
- Extracts:
  - Color palettes (primary, secondary, accent)
  - Typography settings (font sizes, weights, colors)
  - Data label formatting (e.g., "$0.0a", "0,0.0")
  - Legend configuration (position, visibility)
  - Axis settings (labels, grids, scaling)
  - Reference lines (plotLines with thresholds)
  - Annotations (point labels with coordinates)
  - Spacing and margins

**Chart Spec Adapter** (`lib/utils/chart-spec-adapter.ts`):
- Converts ChartSpecification to DesignSpec and VizStrategySpec
- Deep merge utilities for combining specs
- Derives design parameters from agent outputs
- Provides defaults when specs are incomplete

**Recommendation Data Preparer** (`lib/utils/recommendation-data-preparer.ts`):
- Prepares data according to recommendation requirements
- Applies groupBy, aggregations, filters, and sorting
- Formats data structure for Highcharts consumption
- Maps columns to chart axes

**Data Transformer** (`lib/utils/data-transformer.ts`):
- Generic data transformation utilities
- Column mapping and renaming
- Type coercion and validation

**File Parser** (`lib/utils/file-parser.ts`):
- Parses CSV, Excel, and JSON files
- Normalizes data structure to common format
- Handles encoding and formatting issues

**Number Formatter** (`lib/utils/number-formatter.ts`):
- Formatting utilities for data labels
- Currency, percentage, abbreviated numbers
- Locale-aware formatting

## Schemas & Type Safety

**Highcharts Schema** (`lib/schemas/highcharts-schema.ts`):
- Comprehensive Zod schema for complete Highcharts configuration
- Used with `generateObject()` for type-safe AI outputs
- Covers all chart types, axes, series, legends, annotations
- Ensures valid JSON (no functions in config)

**Chart Edit Patch Schema** (`lib/schemas/chart-edit-patch-schema.ts`):
- Schema for JSON patch operations
- Supports: replace, add, remove operations
- Includes edit type classification (simple vs complex)

## Custom Hooks

**Location**: `hooks/` directory (note: uses `components/ui/` for some hooks)

**Available Hooks**:
- `use-mobile.ts` - Mobile breakpoint detection
- `use-toast.ts` - Toast notification management (from Shadcn/ui)

## AI Agent Development

**Agent Prompts**: Stored in `lib/ai/prompts/agents/` as TypeScript exports
- Each agent has a dedicated prompt file
- Prompts exported as constants (e.g., `CHART_ANALYST_AGENT_PROMPT`)
- Some agents have both `.ts` and `.md` versions for documentation

**Agent Orchestration**:
- Multi-agent workflows in API routes
- Sequential execution with streaming progress
- Results stored in localStorage for persistence
- Use `buildChartPlan()` to process agent outputs
- Enable debug drawer in agent panel to inspect outputs

**Best Practices**:
- Use `generateObject()` with Zod schemas for structured outputs
- Use `generateText()` for narrative or flexible outputs
- Set appropriate temperature (0.15-0.3 for deterministic, 0.5+ for creative)
- Handle streaming with SSE for real-time feedback
- Sanitize JSON outputs (remove comments, functions, trailing commas)
- Provide conversation context for chat-based agents

## Development Workflows

### Chart Builder New Page Development
1. **File Upload** → Triggers multi-agent analysis
2. **Agent Progress** → Real-time SSE streaming updates UI
3. **Chart Generation** → Top 3 recommendations rendered as Highcharts
4. **Selection** → User clicks chart to edit
5. **Conversational Editing** → Natural language commands
6. **Two-Stage Editing**:
   - Simple edits use patch operations (fast)
   - Complex edits use full regeneration (comprehensive)

### Adding a New Chart Type
1. Add to Highcharts schema enum in `lib/schemas/highcharts-schema.ts`
2. Update Chart Analyst agent to recommend new type
3. Update Highcharts Generator agent to handle new type
4. Add plotOptions for new type in schema
5. Test with sample data

### Adding a New Agent
1. Create prompt file in `lib/ai/prompts/agents/`
2. Export prompt from `lib/ai/prompts/agents/index.ts`
3. Define output schema if using structured output
4. Integrate into orchestration in `/api/chat/analyze-and-chart`
5. Add progress tracking in UI components
6. Update CLAUDE.md documentation

## Testing

- No automated tests currently configured
- Manual testing workflow:
  1. Upload data file (CSV/Excel/JSON)
  2. Verify agent progress indicators
  3. Check generated charts in gallery
  4. Test conversational editing
  5. Verify chart updates in real-time
  6. Check browser console for errors
  7. Use `/api/debug/chart-plan` endpoint for debugging

## Coding Style & Best Practices

**TypeScript**:
- Functional React components only
- Client components must have `"use client"` directive
- Use `kebab-case` for filenames (e.g., `chart-plan.ts`, `agent-panel.tsx`)
- Define interfaces for props and complex types
- Use Zod schemas for runtime validation

**Styling**:
- Prefer Tailwind utility classes over custom CSS
- Use `cn()` from `lib/utils` for conditional className merging
- Follow OKLCH color space for theme consistency
- Keep components responsive with mobile-first approach

**Component Design**:
- Keep components focused on single responsibility
- Extract reusable logic into hooks or utilities
- Use TypeScript for type safety
- Avoid prop drilling (use localStorage or context for cross-page data)

**API Routes**:
- Use `maxDuration` export for long-running operations
- Implement proper error handling with try-catch
- Return structured JSON responses
- Use streaming (SSE) for long operations
- Log important steps with emoji prefixes for readability

**File Organization**:
- App routes in `app/` with Next.js App Router convention
- Reusable components in `components/` organized by domain
- Shared logic in `lib/` (utilities, parsers, AI prompts, schemas)
- Custom hooks in `hooks/` or `components/ui/`
- Static assets in `public/`

**Git Workflow**:
- Run `pnpm lint` before committing
- Test upload → analysis → chart generation flow after changes
- Check browser console for warnings/errors
- Verify dark mode compatibility

**Performance**:
- Use `useMemo` for expensive computations
- Implement proper cleanup in useEffect
- Avoid unnecessary re-renders
- Use pagination for large datasets
- Leverage streaming for AI responses

## Future Integration Points

**Backend Ready**:
- Auth system can swap localStorage for Supabase/Auth0
- Data persistence ready for database integration (PostgreSQL/MongoDB)
- API routes structured for easy backend integration
- Export system ready for server-side rendering

**AI Enhancements**:
- Multi-agent system fully operational with OpenAI
- Tool calling enabled for chart modifications
- Ready for additional agents (e.g., data quality checker, export optimizer)
- Streaming architecture supports real-time collaboration

**Chart Integration**:
- Uses Highcharts for professional consulting-grade charts
- Follow Highcharts documentation: https://www.highcharts.com/docs/index
- Supports all Highcharts configuration options via chartSpec
- Ready for custom Highcharts modules (e.g., export-data, annotations)

**Analytics & Monitoring**:
- Vercel Analytics integrated
- Ready for error tracking (Sentry)
- Performance monitoring hooks available

## Configuration Files

**TypeScript** (`tsconfig.json`):
- Target: ES6
- Strict mode enabled
- JSX: react-jsx (React 19)
- Path aliases: `@/*` → `./*`
- Module resolution: bundler

**Tailwind** (`app/globals.css`):
- Tailwind CSS v4 with `@import "tailwindcss"`
- Custom variant for dark mode: `@custom-variant dark (&:is(.dark *))`
- Theme defined inline with `@theme inline`
- OKLCH color space for all theme tokens

**PostCSS**:
- Uses `@tailwindcss/postcss` v4 plugin
- Autoprefixer for vendor prefixes

## Environment Variables

Store in `.env.local` (not committed to git):
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## Important Notes

- Uses Next.js 16 with React 19 (both latest stable releases)
- Package manager: **pnpm** (not npm/yarn)
- TypeScript strict mode enabled
- ESLint requires Node ≥20 for `URL.canParse`
- All AI agent calls use OpenAI GPT-4o or GPT-4o-mini models
- Chart editing supports both patch-based (fast) and full regeneration (comprehensive) approaches
- Gallery-based chart builder (`/chart-builder-new`) is the recommended interface for multi-chart workflows
- Original chart builder (`/chart-builder`) remains for single-chart focused work
- Real-time agent progress tracking provides transparency during analysis
- Highcharts Generator Agent uses structured output with Zod for reliability
- All agent outputs are cached in localStorage for offline access and debugging

## Quick Reference

**Key Directories**:
- `app/` - Next.js pages and API routes
- `components/` - React components (ui/, dashboard/, upload/, chart-builder/, chat/)
- `lib/` - Utilities, prompts, schemas, transformers
- `hooks/` - Custom React hooks
- `public/` - Static assets

**Key Files**:
- `lib/utils/chart-plan.ts` - Core chart planning logic
- `lib/utils/chart-spec-parser.ts` - Specification parsing
- `lib/schemas/highcharts-schema.ts` - Type-safe chart generation
- `lib/ai/prompts/agents/index.ts` - Agent prompt exports
- `app/globals.css` - Tailwind v4 theme configuration
- `tsconfig.json` - TypeScript configuration

**Common Commands**:
```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Lint codebase
pnpm add <package>    # Add dependency
```

**Common Patterns**:
```typescript
// Client component
"use client"
import { useState } from "react"

// Using cn() for conditional classes
import { cn } from "@/lib/utils"
className={cn("base-class", condition && "conditional-class")}

// Type-safe AI generation
import { generateObject } from "ai"
import { highchartsConfigSchema } from "@/lib/schemas/highcharts-schema"
const result = await generateObject({
  model: openai('gpt-4o'),
  schema: highchartsConfigSchema,
  prompt: "..."
})

// SSE Streaming
const response = await fetch('/api/chat/analyze-and-chart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data, userMessage })
})
const reader = response.body?.getReader()
```
