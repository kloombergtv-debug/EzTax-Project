# EzTax - Tax Filing Application

## Overview
EzTax is a comprehensive web-based application designed to streamline federal tax return preparation. It guides users through personal information, income, deductions, and tax calculations, featuring automatic computations and data persistence. The project's vision is to simplify tax filing and integrate financial planning, such as retirement readiness, to empower users with a holistic view of their financial well-being.

## User Preferences
Preferred communication style: Simple, everyday language.
Page Layout Preference: Side-by-side layout with input forms taking 2/3 width and instructional videos on the right side taking 1/3 width. Videos should be sticky positioned and embedded with responsive design.

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
- **UI/UX Decisions**: Focus on clean, professional appearance with consistent dollar placeholders, clear field labeling, and intuitive navigation flows. Enhancements include dynamic input formatting and streamlined user guidance messages. Side-by-side layout implementation: input forms take 2/3 width with instructional videos on the right side taking 1/3 width, sticky positioned for better user experience.
- **Retirement Planning Integration**: Features a comprehensive retirement score calculator with multi-factor scoring, inflation adjustments, Social Security integration, and Monte Carlo simulations. This includes a step-by-step guided flow for financial assessment.
- **Admin Panel**: Provides comprehensive user and tax data management capabilities for administrators.
- **Email Functionality**: Integration for expert consultation requests and application submissions.
- **PDF Generation**: Capable of generating Form 1040 PDFs.

## External Dependencies

- **Database**: Neon PostgreSQL serverless
- **Authentication**: Google OAuth 2.0
- **Payment Processing**: Stripe and PayPal
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Development Tools**: TypeScript, ESLint/Prettier, Vite, Drizzle Kit