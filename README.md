# Post Service

## Service Name & Overview

The Post Service handles post creation, editing, deletion, likes, comments, saved posts, search, and admin moderation. It persists posts in MySQL, indexes searchable content in Elasticsearch, and publishes post and interaction events to Kafka for fanout, notifications, and feed ranking.

**Tech Stack**

- **Language:** TypeScript
- **Framework:** Express 4
- **ORM:** Prisma 6 (MySQL)
- **Key libraries:** KafkaJS, Elasticsearch 7.x client, Cloudinary, Sharp, jsonwebtoken

## Architecture & Dependencies

### Internal Dependencies

| Dependency | Purpose |
|---|---|
| **MySQL** | Primary data store (`leaf-posts-db`) via Prisma |
| **Elasticsearch** | Full-text search and user indexing |
| **Kafka** | Publishes post/interaction events; consumes user sync events |

### Event Contracts

See [`../KAFKA_TOPICS.txt`](../KAFKA_TOPICS.txt) for the platform topic list.

| Direction | Topic | Consumer group | Events |
|---|---|---|---|
| **Produces** | `post.events` | — | `post.created`, `post.edited`, `post.deleted` |
| **Produces** | `interaction.events` | — | `post.liked`, `post.unliked`, `post.commented`, `post.uncommented` (key: `postId`) |
| **Produces** | `notification.post.created` | — | `{ type: "post_created", postID, postOwnerID, interactedUserID }` |
| **Consumes** | `user.events` | `post-service-user-events` | Upserts user in Prisma + Elasticsearch |

### External APIs

| Service | Purpose |
|---|---|
| **Cloudinary** | Post image uploads |
| **Elasticsearch** | Search indexing (`ELASTIC_SEARCH_SERVER_URL`) |

## Environment Variables

```bash
# --- Server ---
PORT=2002

# --- Kafka (local — plaintext Docker) ---
KAFKA_MODE=local
KAFKA_BROKERS=localhost:9092

# --- Kafka (Aiven — uncomment and set KAFKA_MODE=aiven) ---
# KAFKA_MODE=aiven
# KAFKA_BROKERS=your-service.a.aivencloud.com:12345
# KAFKA_SASL_USERNAME=your-aiven-username
# KAFKA_SASL_PASSWORD=your-aiven-password
# KAFKA_SASL_MECHANISM=scram-sha-256
# KAFKA_SSL_CA_PATH=./ca.pem
# KAFKA_SSL_CA=

# --- Elasticsearch ---
ELASTIC_SEARCH_SERVER_URL='http://localhost:9200'

# --- Auth / JWT ---
ACCESS_TOKEN_SECRET=your-access-token-secret

# --- Database (local MySQL) ---
DATABASE_URL="mysql://root:your-password@localhost:3306/leaf-posts-db"

# --- Database (Aiven MySQL — uncomment for production) ---
# DATABASE_URL="mysql://avnadmin:your-password@your-service.a.aivencloud.com:12345/defaultdb?sslcert=./certs/aiven-ca.pem&sslaccept=strict"

# --- Admin ---
ADMIN_TOKEN_SECRET=your-admin-token-secret

# --- Cloudinary ---
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

> **Cross-service note:** `ACCESS_TOKEN_SECRET` must match the value configured in user-service.

## Getting Started

### Prerequisites

- **Node.js** 18+ (Dockerfile uses Node 23)
- **MySQL** 8+
- **Kafka** and **Elasticsearch** from parent docker-compose
- **Cloudinary** account

### Local Infrastructure

```bash
# From the parent repo root (d:\main PROJECTS\leaf\)
docker compose up -d kafka elasticsearch
```

Create the MySQL database:

```sql
CREATE DATABASE `leaf-posts-db`;
```

### Install & Run

```bash
cd post-service
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Verify: service listens on `http://localhost:2002`

**Docker (optional):**

```bash
docker build -t post-service .
docker run -p 2002:2002 --env-file .env post-service
```

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/app.ts` | Development with hot reload |
| `start` | `node dist/app.js` | Production start (requires `build`) |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `prisma:generate` | `prisma generate` | Regenerate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run database migrations |
| `prisma:studio` | `prisma studio` | Open Prisma Studio GUI |

## API / Event Interface

Gateway prefix: `/api/v1/post`

### Posts — `/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Yes | Create new post (multipart upload) |
| `GET` | `/:postID/details` | No | Get post details |
| `POST` | `/save/:postID` | Yes | Save post |
| `DELETE` | `/save/:postID` | Yes | Unsave post |
| `GET` | `/save` | Yes | Get saved posts for user |
| `POST` | `/like/:postID` | Yes | Toggle like/unlike |
| `POST` | `/:postID/comment` | Yes | Add comment |
| `DELETE` | `/:postID/comment/:commentID` | Yes | Delete comment |
| `GET` | `/:postID/comment` | No | Get all comments for post |
| `POST` | `/report/:postID` | Yes | Report a post |
| `GET` | `/interaction/:postID` | No | Get interaction counts |
| `GET` | `/search` | No | Search posts or users |
| `GET` | `/timeline/:userID` | No | Fetch user's posted timeline |
| `PATCH` | `/:postID` | Yes | Update post (multipart upload) |
| `DELETE` | `/:postID/delete` | Yes | Delete post |

### Admin — `/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/reported` | Admin | Get reported posts |
| `GET` | `/admin/post/:postID` | Admin | Get post details |
| `PUT` | `/admin/post/:postID` | Admin | Update post status |
| `DELETE` | `/admin/post/:postID` | Admin | Soft delete post |
| `GET` | `/admin/post/:postID/reports` | Admin | Get all reports for a post |
| `PUT` | `/admin/report/:reportID` | Admin | Update single report status |
| `PUT` | `/admin/post/:postID/reports` | Admin | Update all reports for a post |
| `GET` | `/admin/count` | Admin | Get posts count |
| `GET` | `/admin/reports/today` | Admin | Get today's post reports |
