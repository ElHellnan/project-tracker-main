# Project Tracker App

**CRITICAL: Always read PLANNING.md and TASKS.md at the start of every new conversation before doing any work.**

A simplified project management application inspired by Monday.com for personal and team use.

## Project Overview

This is a modern web-based project management tool designed to help individuals and teams organize, track, and manage their work efficiently. The app will feature customizable boards, task management, progress tracking, and collaboration tools.

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **File Storage**: Local storage (expandable to cloud)
- **Real-time**: Socket.io for live updates

## Key Features

### Core Functionality
- Project boards with customizable columns
- Task creation, editing, and assignment
- Progress tracking with visual indicators
- Due date management
- Priority levels (High, Medium, Low)
- File attachments
- Comments and activity timeline

### User Management
- User registration and authentication
- Team collaboration
- Role-based permissions
- User profiles and avatars

### Advanced Features
- Dashboard with analytics
- Search and filtering
- Drag-and-drop interface
- Email notifications
- Export capabilities
- Mobile responsive design

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Database commands
npm run db:migrate
npm run db:seed
npm run db:studio

# Start backend server
npm run server

# Start full stack development
npm run dev:full
```

## Project Structure

```
project-tracker-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # Helper functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── styles/        # CSS and styling
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   └── utils/         # Server utilities
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── shared/                # Shared types and utilities
└── docs/                  # Documentation
```

## Database Schema

### Core Entities
- Users (authentication, profiles)
- Projects (workspace containers)
- Boards (project organization)
- Columns (board sections)
- Tasks (work items)
- Comments (task discussions)
- Attachments (file uploads)

## Getting Started

1. Clone the repository
2. Install dependencies for both client and server
3. Set up environment variables
4. Initialize the database
5. Start the development servers

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/project_tracker"

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Client
REACT_APP_API_URL="http://localhost:3001"
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Projects
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id

### Tasks
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### Comments
- GET /api/tasks/:id/comments
- POST /api/tasks/:id/comments
- PUT /api/comments/:id
- DELETE /api/comments/:id

## Development Notes

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Implement proper error handling and validation
- Use responsive design principles
- Optimize for performance and accessibility
- Write tests for critical functionality
- Document API endpoints and components

## Deployment

The application can be deployed using:
- Frontend: Vercel, Netlify, or static hosting
- Backend: Railway, Heroku, or VPS
- Database: Railway PostgreSQL, Supabase, or managed PostgreSQL

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation as needed
4. Use meaningful commit messages
5. Create pull requests for review