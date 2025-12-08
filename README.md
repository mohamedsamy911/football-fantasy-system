# ⚽ Football Fantasy System

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

A robust backend system for fantasy football applications, built with modern technologies for high performance and scalability.

## 🚀 Features

- **Transfer Marketplace** - Buy, sell, and list players with authentication
- **User Authentication** - Secure identification system
- **API Documentation** - Interactive Swagger UI
- **Containerized Deployment** - Easy setup with Docker

## 🏗️ Architecture

```
Football Fantasy System
├── API Layer (NestJS Controllers)
├── Business Logic (Services)
├── Data Access (Repositories)
├── PostgreSQL (Primary Database)
└── Redis (Cache Layer)
```

## 📋 Prerequisites

- **Node.js** 18+ (for local development)
- **Docker & Docker Compose** (for containerized deployment)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/mohamedsamy911/football-fantasy-system.git
cd football-fantasy-system

# Build and start all services
docker-compose up --build
```

The application will be available at: **http://localhost:3000**

### Manual Local Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/mohamedsamy911/football-fantasy-system.git
   cd football-fantasy-system
   npm install
   ```

2. **Start required services:**
   ```bash
   # Start Redis (port 6379)
   redis-server

   # Start PostgreSQL (port 5432)
   # Ensure PostgreSQL is running with the correct credentials
   ```

3. **Configure environment variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Run the application:**
   ```bash
   npm run start:dev
   ```

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost          # Use 'postgres' in Docker environment
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=football_manager

# Redis Configuration
REDIS_HOST=localhost       # Use 'redis' in Docker environment
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
```

## 📖 API Documentation

### Interactive API Explorer

Once the application is running, access the Swagger UI at:

**http://localhost:3000/api-docs**

### API Endpoints Overview

#### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/identify` | Register or login user | No |

#### 👥 Players
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/players/:id` | Get player details | No |
| GET | `/players/team/:teamId` | Get players by team | No |
| PATCH | `/players/:id` | Update player details | No |
| DELETE | `/players/:id` | Delete a player | No |

#### 🏟️ Teams
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/teams/:id/players` | Get team players | No |

#### 💰 Transfer Market
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/transfers` | List transfer listings | No |
| POST | `/transfers` | Create new listing | Yes |
| DELETE | `/transfers/:id` | Remove listing | Yes |
| POST | `/transfers/buy` | Buy player from listing | Yes |

#### 👤 Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/:id` | Get user details | No |

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **Application** - NestJS application on port 3000
- **PostgreSQL** - Primary database on port 5432
- **Redis** - Cache layer on port 6379

### Docker Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 📁 Project Structure

```
└── 📁src
    └── 📁auth
        └── 📁dto
            ├── identify.dto.ts
        └── 📁strategies
            ├── jwt.strategy.ts
            ├── local.strategy.ts
        ├── auth.controller.spec.ts
        ├── auth.controller.ts
        ├── auth.module.ts
        ├── auth.service.spec.ts
        ├── auth.service.ts
        ├── jwt-auth.guard.ts
    └── 📁common
        └── 📁enums
            ├── player-position.enum.ts
    └── 📁players
        └── 📁dto
            ├── update-player.dto.ts
        └── 📁entities
            ├── player.entity.ts
        ├── players.controller.spec.ts
        ├── players.controller.ts
        ├── players.module.ts
        ├── players.service.spec.ts
        ├── players.service.ts
    └── 📁teams
        └── 📁entities
            ├── team.entity.ts
        └── 📁jobs
            ├── team-creation.processor.ts
        ├── teams.controller.spec.ts
        ├── teams.controller.ts
        ├── teams.module.ts
        ├── teams.service.spec.ts
        ├── teams.service.ts
    └── 📁transfers
        └── 📁dto
            ├── buy.dto.ts
            ├── create-listing.dto.ts
        └── 📁entities
            ├── transfer-listing.entity.ts
        ├── transfers.controller.spec.ts
        ├── transfers.controller.ts
        ├── transfers.module.ts
        ├── transfers.service.spec.ts
        ├── transfers.service.ts
    └── 📁users
        └── 📁dto
            ├── create-user.dto.ts
        └── 📁entities
            ├── user.entity.ts
        ├── users.controller.spec.ts
        ├── users.controller.ts
        ├── users.module.ts
        ├── users.service.spec.ts
        ├── users.service.ts
    ├── app.controller.spec.ts
    ├── app.controller.ts
    ├── app.module.ts
    ├── app.service.ts
    └── main.ts
```

## 🧪 Development

### Available Scripts

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Production start
npm run start:prod

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🔗 Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Support

For issues and questions, please open an issue in the GitHub repository.