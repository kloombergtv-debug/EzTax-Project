# EzTax - Tax Filing Application

## Overview
EzTax is a comprehensive web-based application designed to streamline federal tax return preparation. It guides users through personal information, income, deductions, and tax calculations, featuring automatic computations and data persistence. The project's vision is to simplify tax filing and integrate financial planning, such as retirement readiness, to empower users with a holistic view of their financial well-being. This includes integrating a comprehensive retirement score calculator and a capital gains calculator.

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
- **Authentication**: Supports local username/password and Google OAuth with session-based authentication and secure password hashing. Includes email-based password reset system.
- **UI/UX Decisions**: Focus on clean, professional appearance with consistent dollar placeholders, clear field labeling, and intuitive navigation flows. Enhancements include dynamic input formatting and streamlined user guidance messages. Standardized 1:1 video layout implementation (50% forms, 50% videos) with 75% video height, sticky positioning, and consistent YouTube instructional videos across all major tax input pages.
- **Retirement Planning Integration**: Features a comprehensive retirement score calculator with multi-factor scoring, inflation adjustments, Social Security integration, and Monte Carlo simulations. This includes a step-by-step guided flow for financial assessment.
- **Capital Gains Calculator**: Interactive transaction management with localStorage-based persistence to ensure reliable state updates. Calculates short-term vs long-term gains with automatic tax estimations.
- **Admin Panel**: Provides comprehensive user and tax data management capabilities for administrators.
- **Email Functionality**: Integration for expert consultation requests and application submissions.
- **PDF Generation**: Capable of generating Form 1040 PDFs.
- **AI ChatBot Integration**: Integrated across all major application pages (e.g., PersonalInfo, TaxCredits, Deductions) for contextual support. Utilizes OpenAI GPT-4o model with Korean tax expertise and EzTax-specific training.
- **US Tax Residency Checker**: Dedicated page (`/residency-checker`) for determining US tax residency status using the IRS Substantial Presence Test formula, including student visa exception rules and accurate date calculations. Features F-1 student calendar year-based exemption calculation, J-1 Non-student 2-year exemption rules, and timezone-safe date parsing for consistent results across different environments.
- **State-Based Expert Consultation System**: Professional expert consultation system with state-specific routing (`/expert-consultation/:state`). Features detailed expert profiles with credentials, experience, specialties, and real-time consultation booking. Includes email integration for consultation requests and comprehensive expert information display.

## External Dependencies

- **Database**: Neon PostgreSQL serverless
- **Authentication**: Google OAuth 2.0
- **AI**: OpenAI GPT-4o
- **Payment Processing**: Stripe and PayPal
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Development Tools**: TypeScript, ESLint/Prettier, Vite, Drizzle Kit

## Expert Profile System

### Profile Format Standard
When creating expert profiles, use the following comprehensive format:

#### Basic Information
- **Name**: Full Korean name
- **Title**: Professional designation (e.g., "세무전문가(EA)")
- **Photo**: Real professional headshot (144x144px, circular frame with white border)
- **Rating**: Professional rating out of 5.0
- **Review Count**: Number of client reviews
- **Credentials**: Professional certifications displayed as colored badges

#### Detailed Sections
1. **주요 이력** (Career History)
   - Current positions with date ranges
   - Key professional roles and affiliations
   - Academic positions and board memberships
   - Significant professional contributions

2. **학력** (Education)
   - Universities attended with degrees
   - Graduation years where applicable
   - Specialized academic focus areas

3. **전문 분야** (Professional Specialties)
   - 7-8 specific service areas
   - Bullet-pointed format with colored indicators
   - Client-focused language

4. **회사소개** (Company Introduction)
   - Company philosophy and mission
   - Service approach and values
   - Vision statement

#### Visual Design Standards
- **Card Layout**: Gradient background (blue-to-purple)
- **Photo Frame**: 144x144px circular with 4px white border and shadow
- **Badge Colors**: 
  - IRS EA: Blue background (#bg-blue-100, #text-blue-700)
  - NAKAEA 부회장: Green background (#bg-green-100, #text-green-700)
- **Section Icons**: 
  - 주요 이력: FileText icon (blue)
  - 학력: Users icon (green) 
  - 전문 분야: Star icon (pink)
- **Button Styling**: Gradient action buttons with hover effects

### Image Handling Process
1. **Upload Location**: Save expert photos to `attached_assets/` folder
2. **Copy to Public**: Copy image to `client/public/` with descriptive name
3. **Reference Path**: Use `/filename.png` format for public folder access
4. **Fallback System**: Implement error handling with initial-based SVG fallback

### Expert Data Structure
```typescript
{
  id: number,
  name: string,
  title: string,
  image: string, // Public folder path
  rating: number,
  reviews: number,
  certifications: string[],
  education: string[],
  career: string[],
  expertise: string[],
  bio: string, // Company introduction
  phone: string,
  email: string
}
```

### State-Based Routing
- Route pattern: `/expert-consultation/:state`
- State codes: 'NY' (뉴욕), 'CA' (캘리포니아), etc.
- Each state has dedicated expert listings
- Automatic redirect from Review page based on user's selected state