# EzTax - Tax Filing Application

## Overview
EzTax is a comprehensive web-based application designed to streamline federal tax return preparation. It guides users through personal information, income, deductions, and tax calculations, featuring automatic computations and data persistence. The project's vision is to simplify tax filing and integrate financial planning, such as retirement readiness, to empower users with a holistic view of their financial well-being.

## User Preferences
Preferred communication style: Simple, everyday language.
Number display preference: All numbers must be displayed as integers without decimal points using Math.round() for clean presentation.
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

- **Input Field Dollar Sign Duplication Issue (2025-01-11)**: Multiple pages (TaxCredits, AdditionalTax, RetirementContributions) showed "$ $" or duplicate dollar signs in input fields.
  - Root Cause: CSS absolute positioning added "$" symbols while placeholders also contained "$" symbols
  - Solution: Removed CSS absolute positioned `<span>` elements containing "$" symbols from all affected pages
  - Updated placeholders to "$" format instead of "$0" or "0.00" to maintain proper dollar formatting
  - Removed `pl-8` padding classes that were accommodating the removed absolute positioned elements
  - Applied to: TaxCredits.tsx, AdditionalTax.tsx, RetirementContributions.tsx, TaxCredits3.tsx
  - Key Fix: Use placeholder="$" with simple Input components instead of complex relative div structures with absolute positioned dollar symbols
  - **TaxCredits3.tsx Updates (2025-01-13)**: 
    - Fixed ALL duplicate "$" symbols across TaxCredits3.tsx page
    - Removed absolute positioned span elements and pl-8 classes from ALL fields:
      * "기타 부양가족 공제 (Credit for Other Dependents)" field
      * Child Tax Credit (자녀 세액공제) field
      * 자녀 및 부양가족 돌봄비용 세액공제 field
      * 총 돌봄 비용 field
      * 지불 금액 field  
      * 미국 오퍼튜니티 세액공제 (AOTC) field
      * 평생 학습 세액공제 (LLC) field
      * 외국납부세액공제액 (Foreign Tax Credit) field
      * 근로소득공제액 (Earned Income Credit) field
    - All input field placeholders standardized to "$" format for clean UI consistency
    - Complete systematic fix applied to ensure no duplicate "$" symbols remain in any tax credit input fields

- **Password Reset System Implementation (2025-01-12)**: Complete email-based password reset system with Gmail integration and proper salt/hash security.
  - **Email Integration**: Gmail SMTP configuration with proper domain handling (Replit vs localhost)
  - **Security Implementation**: Random token generation, 1-hour expiration, salt/hash password storage format
  - **Bilingual Support**: Korean/English email templates with professional styling
  - **Salt/Hash Fix**: Resolved password authentication errors by implementing proper `hash.salt` storage format in `updateUserPassword` method
  - **Test Accounts**: Created eztax88@gmail.com and equitykr@gmail.com for testing
  - **Endpoints**: `/api/forgot-password`, `/api/reset-password`, `/api/change-password` all fully functional
  - Status: All password management features tested and working correctly

- **Floating-Point Precision Fix Implementation (2025-01-13)**: Complete elimination of decimal points in all number displays across BusinessExpense.tsx and Income-fixed.tsx.
  - **Root Cause**: JavaScript floating-point arithmetic causing displays like "89,200.01" instead of clean integers
  - **Solution Applied**: Math.round() applied to all calculation functions and display elements
  - **Fixed Components**: calculateTotalExpenses(), calculateNetIncome(), calculateTotalK1Income(), and all display elements (.toLocaleString())
  - **User Preference**: All numbers must display as integers without decimal points for clean presentation
  - **Files Updated**: BusinessExpense.tsx (complete precision fix), Income-fixed.tsx (comprehensive precision fix completed)
  - **Income-fixed.tsx Updates (2025-01-13)**: 
    - All input field placeholders changed from "달러 금액" to "$" 
    - All value displays use Math.round().toLocaleString() format
    - All onChange handlers use Math.round(parseFloat()) for integer processing
    - Removed complex relative/absolute positioning structure for "기타 소득" field
    - Applied regex pattern /[^0-9]/g (no decimal points) to all input validation
  - Status: All number displays now show clean integers (e.g., "89,200" instead of "89,200.01")

### Current Active Page Files (2025-01-13)
- **Income Page**: Currently using `Income-fixed.tsx` as the main income input page (referenced in App.tsx as IncomePage component)
- **Video Status**: YouTube instructional video temporarily removed from Income-fixed.tsx (user request, to be restored after 1 hour)
- **Layout**: Modified to use full-width layout when video is removed (grid-cols-1 instead of grid-cols-2)
- **AI ChatBot**: Successfully integrated AI chatbot on Income page with OpenAI GPT-4o model
  - **Components**: ChatBot.tsx component with real-time chat interface
  - **Backend**: /api/chat endpoint with Korean tax expertise system prompt
  - **Status**: Functional but requires valid OpenAI API key with sufficient quota
  - **Current Issue**: API quota exceeded - user needs to check OpenAI billing/usage limits

## External Dependencies

- **Database**: Neon PostgreSQL serverless
- **Authentication**: Google OAuth 2.0
- **Payment Processing**: Stripe and PayPal
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Development Tools**: TypeScript, ESLint/Prettier, Vite, Drizzle Kit