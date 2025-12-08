# ⚽ Football Fantasy System

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A production-ready backend system for fantasy football applications, built with **NestJS** for high performance, security, and scalability.

---

## ✨ Features

| Feature                     | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| 🔐 **JWT Authentication**   | Secure token-based authentication with bcrypt password hashing |
| 💰 **Transfer Marketplace** | Buy, sell, and list players with atomic transactions           |
| ⚡ **Redis Caching**        | High-performance caching layer for optimized queries           |
| 📊 **API Versioning**       | All endpoints versioned (`/v1/...`) for backward compatibility |
| 📖 **Swagger Docs**         | Interactive API documentation with OpenAPI specification       |
| 🐳 **Docker Ready**         | One-command deployment with Docker Compose                     |
| 🛡️ **Input Validation**     | Comprehensive DTO validation with class-validator              |
| 🔄 **Database Migrations**  | Production-safe schema management with TypeORM                 |

---

## 🏗️ Architecture

```
            ┌─────────────────────────────────────────────────────────────┐
            │                    Client Applications                      │
            └──────────────────────────┬──────────────────────────────────┘
                                       │ HTTPS
            ┌──────────────────────────▼──────────────────────────────────┐
            │                    API Gateway (v1)                         │
            │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
            │  │  Auth   │  │ Players │  │  Teams  │  │   Transfers     │ │
            │  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
            └───────┼────────────┼────────────┼────────────────┼──────────┘
                    │            │            │                │
            ┌───────▼────────────▼────────────▼────────────────▼──────────┐
            │                    Service Layer                            │
            │           (Business Logic + Validation)                     │
            └───────┬────────────┬────────────────────────────┬───────────┘
                    │            │                            │
            ┌───────▼────┐  ┌────▼─────┐               ┌──────▼──────┐
            │ PostgreSQL │  │  Redis   │               │   BullMQ    │
            │ (Primary)  │  │ (Cache)  │               │   (Jobs)    │
            └────────────┘  └──────────┘               └─────────────┘
```

---

## 📋 Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose** (recommended)
- **npm** or **yarn**

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start
git clone https://github.com/mohamedsamy911/football-fantasy-system.git
cd football-fantasy-system
docker-compose up --build
```

🎉 Application available at: **http://localhost:3000**

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start Redis & PostgreSQL (via Docker or locally)
docker-compose up -d postgres redis

# 4. Run development server
npm run start:dev
```

---

## 🔧 Environment Variables

| Variable      | Description                    | Default            |
| ------------- | ------------------------------ | ------------------ |
| `DB_HOST`     | PostgreSQL host                | `localhost`        |
| `DB_PORT`     | PostgreSQL port                | `5432`             |
| `DB_USER`     | Database user                  | `postgres`         |
| `DB_PASSWORD` | Database password              | `postgres`         |
| `DB_NAME`     | Database name                  | `football_manager` |
| `REDIS_HOST`  | Redis host                     | `localhost`        |
| `REDIS_PORT`  | Redis port                     | `6379`             |
| `JWT_SECRET`  | **Required** - JWT signing key | -                  |
| `PORT`        | Application port               | `3000`             |
| `NODE_ENV`    | Environment mode               | `development`      |

> ⚠️ **Important:** `JWT_SECRET` must be set in production!

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000/v1
```

### Interactive Docs

Swagger UI available at: **http://localhost:3000/api-docs**

---

### 🔐 Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

| Method | Endpoint            | Description            | Auth |
| ------ | ------------------- | ---------------------- | ---- |
| `POST` | `/v1/auth/identify` | Register or login user | ❌   |

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "message": "User registered successfully. Team creation in progress.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 👥 Players

| Method   | Endpoint                   | Description           | Auth  |
| -------- | -------------------------- | --------------------- | ----- |
| `GET`    | `/v1/players/:id`          | Get player details    | ❌    |
| `GET`    | `/v1/players/team/:teamId` | Get players by team   | ❌    |
| `PATCH`  | `/v1/players/:id`          | Update player details | ✅ 🔒 |
| `DELETE` | `/v1/players/:id`          | Delete a player       | ✅ 🔒 |

> 🔒 **Ownership Required:** Users can only modify their own players.

---

### 🏟️ Teams

| Method | Endpoint                | Description      | Auth |
| ------ | ----------------------- | ---------------- | ---- |
| `GET`  | `/v1/teams/:id/players` | Get team players | ❌   |

---

### 💰 Transfer Market

| Method   | Endpoint            | Description             | Auth  |
| -------- | ------------------- | ----------------------- | ----- |
| `GET`    | `/v1/transfers`     | List transfer listings  | ❌    |
| `POST`   | `/v1/transfers`     | Create new listing      | ✅ 🔒 |
| `DELETE` | `/v1/transfers/:id` | Remove listing          | ✅ 🔒 |
| `POST`   | `/v1/transfers/buy` | Buy player from listing | ✅    |

**Query Parameters for `GET /v1/transfers`:**

| Parameter    | Type   | Description                              |
| ------------ | ------ | ---------------------------------------- |
| `playerName` | string | Filter by player name (partial match)    |
| `teamId`     | UUID   | Filter by team ID                        |
| `minPrice`   | number | Minimum price filter                     |
| `maxPrice`   | number | Maximum price filter                     |
| `limit`      | number | Results per page (default: 50, max: 100) |
| `offset`     | number | Pagination offset                        |

---

### 👤 Users

| Method | Endpoint        | Description      | Auth |
| ------ | --------------- | ---------------- | ---- |
| `GET`  | `/v1/users/:id` | Get user details | ❌   |

---

## 🐳 Docker

### Services

| Service    | Port | Description         |
| ---------- | ---- | ------------------- |
| `app`      | 3000 | NestJS application  |
| `postgres` | 5432 | PostgreSQL database |
| `redis`    | 6379 | Redis cache         |

### Commands

```bash
docker-compose up -d          # Start in background
docker-compose logs -f app    # View app logs
docker-compose down           # Stop services
docker-compose down -v        # Stop and remove volumes
```

---

## 📁 Project Structure

```
src/
├── auth/                 # Authentication (JWT, strategies)
├── common/               # Shared decorators, enums, guards
├── config/               # Configuration (cache, constants)
├── migrations/           # Database migrations
├── players/              # Player management
├── teams/                # Team management + job processors
├── transfers/            # Transfer marketplace
├── users/                # User management
├── app.module.ts         # Root module
├── data-source.ts        # TypeORM migration config
└── main.ts               # Application entry point
```

---

## 🧪 Development

### Scripts

| Command              | Description                 |
| -------------------- | --------------------------- |
| `npm run start:dev`  | Development with hot reload |
| `npm run build`      | Production build            |
| `npm run start:prod` | Production start            |
| `npm test`           | Run unit tests              |
| `npm run test:cov`   | Test with coverage          |
| `npm run lint`       | Lint code                   |
| `npm run format`     | Format code                 |

### Database Migrations

```bash
npm run migration:generate   # Generate from entity changes
npm run migration:run        # Apply pending migrations
npm run migration:revert     # Rollback last migration
npm run migration:show       # Show migration status
```

> **Note:** Development uses `synchronize: true`. Production must use migrations.

---

## 🔒 Security Features

- ✅ **JWT Authentication** with configurable expiration
- ✅ **Password Hashing** with bcrypt (10 rounds)
- ✅ **Ownership Validation** on player/listing mutations
- ✅ **UUID Validation** on all path parameters
- ✅ **Input Sanitization** via class-validator
- ✅ **Password Exclusion** from API responses

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🔗 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Swagger/OpenAPI](https://swagger.io/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🆘 Support

For issues and questions, please [open an issue](https://github.com/mohamedsamy911/football-fantasy-system/issues) on GitHub.

---

<p align="center">
  Made with ❤️ using <a href="https://nestjs.com/">NestJS</a>
</p>
