# Project Tracker App

A modern, full-stack project management application inspired by Monday.com, built with React, Node.js, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **Project Management**: Create and manage projects with team collaboration
- **Task Management**: Advanced task system with assignments, priorities, and due dates
- **Board System**: Customizable boards with drag-and-drop columns
- **Team Collaboration**: Role-based permissions (Owner, Admin, Member, Viewer)
- **Real-time Updates**: Live task updates and notifications
- **File Attachments**: Upload and manage files on tasks
- **Comments**: Task discussions and activity timeline

### Advanced Features
- **Drag & Drop**: Intuitive task movement between columns
- **Search & Filter**: Advanced task filtering and search capabilities
- **Statistics**: Project analytics and progress tracking
- **Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **@dnd-kit** for drag-and-drop functionality
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** authentication with bcrypt
- **Zod** for input validation
- **Multer** for file uploads

### Database
- **PostgreSQL** for data persistence
- **Prisma** for database management and migrations

## 📁 Project Structure

```
project-tracker-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # API client and utilities
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Server utilities
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── shared/                # Shared TypeScript types
└── docs/                  # Documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-tracker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   
   # Edit the .env files with your configuration
   ```

4. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   # Start backend (from server directory)
   npm run dev
   
   # Start frontend (from client directory)
   npm run dev
   ```

## 📊 Database Schema

The application uses a comprehensive database schema with the following entities:

- **Users**: Authentication and user profiles
- **Projects**: Project containers with team collaboration
- **Boards**: Organization units within projects
- **Columns**: Customizable workflow stages
- **Tasks**: Work items with full metadata
- **Comments**: Task discussions
- **Attachments**: File uploads linked to tasks

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/move` - Move task between columns
- `GET /api/tasks/:id/comments` - Get task comments

## 🧪 Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both client and server
npm run build        # Build both client and server
npm run lint         # Lint all code
npm run typecheck    # TypeScript type checking

# Client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Server
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Code Quality
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Husky** for Git hooks
- **lint-staged** for pre-commit checks

## 🚀 Deployment

### Backend Deployment (Railway/Heroku)
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy the server code

### Frontend Deployment (Vercel/Netlify)
1. Build the client application
2. Configure environment variables
3. Deploy static files

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

Built with ❤️ using modern web technologies.