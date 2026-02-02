# VerifyPal

## Overview

VerifyPal is a Chrome browser extension with an accompanying landing page website. The extension automatically detects verification codes (OTP, 2FA codes) in email clients like Gmail, Outlook, and Yahoo, then auto-fills them into sign-in forms on any website. The web application serves as a marketing landing page and provides a download endpoint for the extension.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Chrome Extension Architecture
- **Manifest Version**: 3 (modern Chrome extension format)
- **Components**:
  - Background service worker (`background.js`) - manages code storage and inter-script communication
  - Email detector content script (`email-detector.js`) - scans email clients for verification codes
  - Code filler content script (`code-filler.js`) - auto-fills detected codes into form fields
  - Popup UI (`popup.html/js`) - user interface for managing detected codes
- **Storage**: Chrome local storage for code history and settings
- **Permissions**: activeTab, storage, clipboardWrite, and host permissions for major email providers

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated via `drizzle-kit push` to `./migrations`
- **Current Schema**: Basic users table with id, username, and password fields
- **In-Memory Fallback**: MemStorage class for development without database

### API Structure
- Single REST endpoint: `GET /api/download-extension` - serves the Chrome extension as a ZIP file using the `archiver` library
- Static file serving for production builds
- SPA fallback routing for client-side navigation

## External Dependencies

### Third-Party Services
- **Database**: PostgreSQL (via `DATABASE_URL` environment variable)
- **Session Store**: connect-pg-simple for PostgreSQL session storage

### Key Libraries
- **UI Components**: Full shadcn/ui component library with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **Date Handling**: date-fns
- **File Compression**: archiver (for extension ZIP downloads)

### Email Client Integrations (Extension)
The extension monitors and extracts verification codes from:
- Gmail (mail.google.com)
- Outlook (outlook.live.com, outlook.office.com)
- Yahoo Mail (mail.yahoo.com)

### Development Tools
- Replit-specific Vite plugins for error overlay, cartographer, and dev banner
- TypeScript with strict mode enabled
- PostCSS with Tailwind and autoprefixer