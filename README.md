# Lumora

A modern SaaS platform for creating professional charts with AI-powered conversations. Built with React, Next.js, Tailwind CSS, and Highcharts.

## Features

- **AI-Powered Chart Creation**: Chat naturally with our AI agent to generate charts
- **Multiple Chart Types**: Bar, Line, Pie, Area, and Scatter charts
- **Real-time Rendering**: Live chart updates as you customize
- **Data Upload**: Support for CSV, Excel, and JSON formats
- **Export Options**: Download as PNG, SVG, PDF, or PowerPoint
- **Professional Design**: Enterprise-grade UI with smooth animations
- **Responsive Layout**: Optimized for desktop and tablet

## Tech Stack

- **Frontend**: React 18, Next.js 16
- **Styling**: Tailwind CSS v4
- **Charts**: Highcharts
- **Authentication**: Mock (ready for integration)
- **Storage**: Local Storage (mock, ready for backend integration)

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
app/
├── page.tsx                 # Landing page
├── login/page.tsx          # Login page
├── signup/page.tsx         # Signup page
├── dashboard/
│   ├── page.tsx            # Dashboard home
│   ├── upload/page.tsx     # Data upload
│   ├── chart-builder/page.tsx  # Chart creation workspace
│   ├── export/page.tsx     # Export options
│   └── settings/page.tsx   # User settings
└── globals.css             # Global styles

components/
├── dashboard/
│   ├── sidebar.tsx         # Navigation sidebar
│   └── project-grid.tsx    # Project cards
├── upload/
│   ├── data-uploader.tsx   # File upload component
│   ├── data-preview.tsx    # Data table preview
│   └── ai-chat.tsx         # AI assistant chat
├── chart-builder/
│   ├── chart-canvas.tsx    # Highcharts rendering
│   ├── chart-type-selector.tsx  # Chart type picker
│   ├── properties-panel.tsx # Customization panel
│   ├── chart-chat.tsx      # Conversational interface
│   └── toolbar.tsx         # Top toolbar
└── ui/
    ├── button.tsx          # Button component
    └── card.tsx            # Card component
\`\`\`

## Key Features

### Authentication
- Email/password login and signup
- Google OAuth placeholder
- Mock authentication with localStorage

### Dashboard
- Project management with recent projects
- Quick access to upload and create new projects
- User profile and settings

### Data Upload
- Drag-and-drop file uploader
- Support for CSV, Excel, JSON
- Data preview with pagination
- AI assistant suggestions

### Chart Builder
- 5 chart types (Bar, Line, Pie, Area, Scatter)
- Real-time chart rendering with Highcharts
- Customizable colors, legends, and styling
- Conversational AI interface for natural language commands
- Undo/Redo functionality
- Save and export options

### Export
- Multiple format support (PNG, SVG, PDF, PowerPoint)
- High-resolution export option
- Watermark support (Pro tier)
- Preview before download

## Customization

### Colors
Edit the color theme in `app/globals.css`:
\`\`\`css
--color-primary: #001F3F;      /* Deep blue */
--color-accent: #00BFFF;       /* Teal */
--color-background: #F5F5F5;   /* Light gray */
--color-surface: #FFFFFF;      /* White */
\`\`\`

### Chart Colors
Modify the `COLORS` array in `components/chart-builder/chart-canvas.tsx`

## Deployment

Deploy to Vercel with one click:

\`\`\`bash
vercel deploy
\`\`\`

Or connect your GitHub repository to Vercel for automatic deployments.

## Future Enhancements

- Real backend authentication with Supabase or Auth0
- Database integration for project persistence
- Real AI integration with LLM API
- Collaborative features
- Advanced chart customization
- Team management
- API for programmatic chart creation

## License

MIT
