# EzTax - Tax Filing Application

## Overview
EzTax is a comprehensive web-based application designed to streamline federal tax return preparation. It guides users through personal information, income, deductions, and tax calculations, featuring automatic computations and data persistence. The project's vision is to simplify tax filing and integrate financial planning, such as retirement readiness, to empower users with a holistic view of their financial well-being.

## User Preferences
Preferred communication style: Simple, everyday language.
Page Layout Preference: 
- Side-by-side layout with 1:1 ratio (50:50) for optimal video viewing
- Input forms and instructional videos side by side with equal width
- Videos should be sticky positioned and embedded with responsive design
- Video aspect ratio: 75% height (pb-[75%]) for larger display area
- Grid layout: `grid-cols-1 lg:grid-cols-2` with `lg:col-span-1` for each section

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Context API
- **UI**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Passport.js (local and Google OAuth)
- **Session Management**: Express sessions with PostgreSQL storage

### Database
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit
- **Key Tables**: `users`, `tax_returns` (using JSON columns for tax data), and session storage.

### Core Features
- **Step-by-step Tax Flow**: Personal Information, Income, Deductions, Tax Credits, Additional Tax, Review & Filing.
- **Tax Calculation Engine**: Implements federal tax brackets, standard deductions, SALT limits, Child Tax Credit, Retirement Savings Credit, and Self-employment tax for 2024/2025 tax years.
- **Data Persistence**: Real-time saving and restoration of tax data to PostgreSQL using JSON-based storage.
- **Authentication**: Supports local username/password and Google OAuth with session-based authentication and secure password hashing.
- **UI/UX Decisions**: Focus on clean, professional appearance with consistent dollar placeholders, clear field labeling, and intuitive navigation flows. Enhancements include dynamic input formatting and streamlined user guidance messages. Standardized 1:1 video layout implementation (50% forms, 50% videos) with 75% video height, sticky positioning, and consistent YouTube instructional videos across all major tax input pages (PersonalInfo, Income, Deductions, TaxCredits, AdditionalTax, Review, RetirementContributions).
- **Retirement Planning Integration**: Features a comprehensive retirement score calculator with multi-factor scoring, inflation adjustments, Social Security integration, and Monte Carlo simulations. This includes a step-by-step guided flow for financial assessment.
- **Capital Gains Calculator**: Interactive transaction management with localStorage-based persistence to ensure reliable state updates. Calculates short-term vs long-term gains with automatic tax estimations.
- **Admin Panel**: Provides comprehensive user and tax data management capabilities for administrators.
- **Email Functionality**: Integration for expert consultation requests and application submissions.
- **PDF Generation**: Capable of generating Form 1040 PDFs.

### Technical Solutions Archive
- **React State Management Issue (2025-01-10)**: Capital Gains Calculator experienced persistent state update failures with useState/useReducer. Solution: Implemented localStorage-based state management with component force re-rendering using keys. This bypasses React's state system entirely while maintaining data persistence and UI updates.
  - Key Implementation: Replace React state arrays with localStorage functions that read/write data directly
  - Force UI updates using setComponentKey and setForceUpdate to trigger complete component remount
  - This pattern resolves cases where React state updates fail mysteriously despite correct logic

## External Dependencies

- **Database**: Neon PostgreSQL serverless
- **Authentication**: Google OAuth 2.0
- **Payment Processing**: Stripe and PayPal
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Development Tools**: TypeScript, ESLint/Prettier, Vite, Drizzle Kit