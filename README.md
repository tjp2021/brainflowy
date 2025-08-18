# BrainFlowy 🧠

A modern, AI-powered hierarchical note-taking application with voice input capabilities.

## Overview

BrainFlowy revolutionizes note-taking by combining hierarchical outline management with cutting-edge AI technology. Speak naturally and watch as your thoughts are automatically transcribed and intelligently organized into structured outlines using OpenAI Whisper and Claude 3.5 Sonnet.

## ✨ Key Features

### AI-Powered Voice Input (NEW! ✅)
- **Real-time Voice Transcription**: Powered by OpenAI Whisper for accurate speech-to-text
- **Intelligent Text Structuring**: Claude 3.5 Sonnet automatically organizes your thoughts
- **Multi-language Support**: Transcribe in dozens of languages
- **Smart Hierarchy**: AI understands context and creates logical groupings

### Core Functionality
- **Hierarchical Outline Management**: Create, organize, and navigate nested outlines
- **Mobile-First Design**: Optimized for touch interactions and mobile devices
- **Real-time Sync**: Keep your notes synchronized across devices
- **Offline Support**: Continue working without internet connection
- **PWA Capabilities**: Install as a native app on any device

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for state management
- **React Router** for navigation
- **D3.js** for mind map visualizations

### Backend
- **FastAPI** with Python 3.12
- **Azure Cosmos DB** for scalable document storage
- **JWT** for secure authentication
- **OpenAI API** for Whisper voice transcription
- **Anthropic API** for Claude text structuring
- **Pydantic** for data validation

### DevOps
- **Docker** for containerization
- **Docker Compose** for local development
- **GitHub Actions** for CI/CD
- **Nginx** for reverse proxy (production)

## Project Structure

```
brainflowy/
├── frontend/           # React TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/            # FastAPI Python backend
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── ...
├── docker/             # Docker configuration
│   ├── frontend/
│   ├── backend/
│   └── docker-compose.yml
├── .taskmaster/        # Task management (development)
├── package.json        # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Docker** and **Docker Compose** (for containerized development)
- **PostgreSQL** (for local development without Docker)
- **Redis** (for local development without Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/brainflowy.git
   cd brainflowy
   ```

2. **Start the development environment**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/brainflowy.git
   cd brainflowy
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

5. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   
   # Edit the .env files with your configuration
   ```

### Available Scripts

From the root directory:

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build only frontend  
npm run build:backend    # Build only backend

# Testing
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests

# Linting
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues

# Cleaning
npm run clean            # Clean all build artifacts
```

## Development Workflow

This project uses **Task Master AI** for development workflow management. The development tasks are organized and tracked in the `.taskmaster/` directory.

### Development Commands

```bash
# View current tasks
task-master list

# Get next task to work on
task-master next

# View task details
task-master show <task-id>

# Update task status
task-master set-status --id=<task-id> --status=done
```

## API Documentation

The FastAPI backend provides interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=BrainFlowy
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/brainflowy
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Testing

### Frontend Testing
```bash
cd frontend
npm run test        # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:ui     # Run tests with UI
```

### Backend Testing  
```bash
cd backend
pytest              # Run tests
pytest --cov        # Run tests with coverage
```

## Deployment

### Production Docker Build
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Manual Deployment
1. Build the frontend: `npm run build:frontend`
2. Set up production environment variables
3. Deploy backend with a WSGI server (e.g., Gunicorn)
4. Serve frontend static files with Nginx

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please:
1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-username/brainflowy/issues)
3. Create a new [issue](https://github.com/your-username/brainflowy/issues/new)

## Roadmap

- [ ] Phase 1: Core infrastructure and basic mind mapping
- [ ] Phase 2: Advanced mind mapping features
- [ ] Phase 3: Collaboration and sharing
- [ ] Phase 4: Mobile application
- [ ] Phase 5: Advanced analytics and insights

---

**BrainFlowy** - Organize your thoughts, visualize your ideas.