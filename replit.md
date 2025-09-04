# Overview

This is a comprehensive School Management System built with React, Express, and PostgreSQL. The system serves multiple user roles including Super Admins, School Admins, Teachers, Students, and Parents. It provides complete functionality for managing academic operations including student enrollment, attendance tracking, exam management, fee collection, messaging, and academic record keeping. The application features role-based dashboards with specialized interfaces for each user type, from system-wide administration to individual student portals.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and follows a component-based architecture:
- **UI Framework**: Radix UI components with custom styling via Tailwind CSS
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing with protected routes
- **Authentication**: Context-based auth system with session management
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Layout System**: Responsive dashboard layout with role-based sidebar navigation

## Backend Architecture
The server uses Express.js with a layered architecture:
- **API Layer**: RESTful endpoints organized by resource type (schools, users, classes, etc.)
- **Authentication**: Passport.js with local strategy and session-based auth
- **Data Access**: Centralized DatabaseStorage class handling all database operations
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Global error middleware with structured error responses

## Database Design
PostgreSQL database with Drizzle ORM for type-safe database operations:
- **Core Entities**: Users, Schools, Classes, Subjects, Students, Teachers
- **Academic Features**: Exams, Marks, Attendance, Homework, Materials, Tests
- **Administrative Features**: Fee Structures, Payments, Bills, Messages
- **Relationships**: Proper foreign key constraints with many-to-many relationships for class-subject-teacher assignments

## Authentication & Authorization
Role-based access control system:
- **Session Management**: Express sessions with PostgreSQL session store
- **Password Security**: Scrypt-based password hashing with salt
- **Route Protection**: Protected routes with role-based access control
- **User Roles**: Super Admin, School Admin, Teacher, Student, Parent with distinct permissions

## Data Flow & State Management
- **Server State**: TanStack Query for caching, synchronization, and error handling
- **Context Providers**: SchoolDataContext for shared school-related data across components
- **Form State**: React Hook Form with Zod validation for client-side validation
- **Real-time Updates**: Optimistic updates with automatic cache invalidation

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with custom design tokens via theme.json

## Backend Dependencies
- **Web Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL with Drizzle ORM and pg driver
- **Authentication**: Passport.js with local strategy for user authentication
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage

## Development & Build Tools
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full TypeScript support across client and server
- **Testing**: Cypress for end-to-end testing
- **Code Quality**: ESBuild for server bundling, TSX for development server

## Validation & Forms
- **Schema Validation**: Zod for runtime type checking and API validation
- **Form Handling**: React Hook Form with Hookform Resolvers for Zod integration
- **Date Handling**: date-fns for date manipulation and formatting

## Data Management
- **Server State**: TanStack React Query for server state management
- **Tables**: TanStack React Table for complex data display and manipulation
- **Database Migrations**: Drizzle Kit for schema migrations and database management

The system is designed for scalability with proper separation of concerns, type safety throughout, and a responsive interface that works across desktop and mobile devices.