# 🔍 AI Product Search Hub

> Multi-LLM AI-powered product search platform across Amazon, Flipkart, BestBuy, Walmart, Reliance Digital & Croma — with RAG architecture, smart caching, and intelligent recommendations.

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-61dafb)](https://www.mongodb.com/)
[![AI Powered](https://img.shields.io/badge/AI-Grok%20%7C%20Gemini%20%7C%20OpenRouter-6366f1)](#)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## ✨ Features

- 🤖 **Multi-LLM Search** — Grok (Amazon), Gemini (Flipkart), OpenRouter (Global) run in parallel
- 🧠 **RAG Architecture** — MongoDB vector search caches product knowledge for instant results
- ⚡ **Smart Caching** — 2-layer cache (node-cache + Redis) with automatic TTL
- 🎯 **AI Recommendations** — Best Overall / Best Value / Best Premium / Best Budget with reasoning
- 🔒 **Prompt Injection Protection** — Guards against LLM manipulation attempts
- 📊 **Analytics Dashboard** — Admin dashboard with trends, cache stats, API usage
- 🔐 **JWT Auth** — Secure access + refresh token rotation
- 📱 **Responsive SaaS UI** — Dark-mode modern design with Tailwind CSS
- 🐳 **Docker Ready** — One-command full stack spin-up

---

## 🏗️ Architecture

```
Client (React + Vite)
    │
    ▼
Express.js API (Node.js)
    │
    ├── Auth Middleware (JWT)
    ├── Rate Limiter + Prompt Guard
    │
    ├── RAG Layer (MongoDB Vector / Text Search)
    │       ↑ cache hit → return immediately
    │
    ├── Cache Layer (node-cache + Redis)
    │       ↑ cache hit → return immediately
    │
    └── Parallel AI Search (Promise.allSettled)
            ├── Grok API → Amazon products
            ├── Gemini API → Flipkart products
            └── OpenRouter → BestBuy, Walmart, Reliance, Croma
                        │
                        └── Aggregate → Deduplicate → Rank → AI Recommendations
                                    │
                                    └── Cache results → Return to client
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional — app works without it)
- API keys: Grok, Gemini, OpenRouter

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-product-search.git
cd ai-product-search
npm run install:all
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_product_search

JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

GROK_API_KEY=xai-your_key_here
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=sk-or-your_key_here

REDIS_URL=redis://localhost:6379   # Optional
```

### 3. Start Development

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **API Docs:** http://localhost:5000/api-docs

---

## 🐳 Docker (Full Stack)

```bash
# Copy and fill in API keys
cp server/.env.example .env

docker-compose up -d
```

This starts MongoDB, Redis, the Express server, and the React app (via nginx) all in one command.

---

## 📁 Project Structure

```
ai-product-search/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/            # Navbar, Footer, Layout
│       │   ├── ui/                # Badge, StarRating, Skeleton, Toast
│       │   ├── search/            # SearchBox, SearchFilters, CompareBar
│       │   └── product/           # ProductCard, ProductGrid, AIRecommendationPanel
│       ├── pages/                 # All route pages
│       ├── hooks/                 # useProducts, useDebounce
│       ├── services/              # API client + product service
│       └── store/                 # Zustand stores (auth, search)
│
└── server/                        # Express.js backend
    └── src/
        ├── config/                # DB + Swagger setup
        ├── controllers/           # Route handlers
        ├── middleware/            # Auth, rate limiter, error handler
        ├── models/                # Mongoose schemas
        ├── prompts/               # LLM prompt templates
        ├── routes/                # Express routers
        ├── services/
        │   ├── ai/                # grok.service, gemini.service, openrouter.service
        │   ├── cache/             # node-cache + Redis layer
        │   └── rag/               # Vector + text search
        ├── utils/                 # logger, responseHelper, promptGuard
        └── app.js                 # Express entry point
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, get tokens |
| `POST` | `/api/auth/refresh` | — | Refresh access token |
| `POST` | `/api/auth/logout` | ✅ | Invalidate refresh token |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `GET` | `/api/products/search?q=` | Optional | Multi-platform AI search |
| `GET` | `/api/products/:id` | — | Get product by ID |
| `POST` | `/api/products/compare` | — | Compare up to 4 products |
| `POST` | `/api/products/save` | ✅ | Save/unsave a product |
| `GET` | `/api/user/history` | ✅ | User search history |
| `GET` | `/api/user/saved` | ✅ | User saved products |
| `GET` | `/api/analytics/dashboard` | ✅ Admin | Analytics overview |
| `GET` | `/api/analytics/trends` | ✅ | Search volume trends |

Full Swagger docs: `http://localhost:5000/api-docs`

---

## 🤖 AI Flow

### Search Execution Order

```
1. RAG (Vector/Text) Search  →  if ≥3 results: return immediately (no API cost)
2. Redis Cache check         →  hit: return cached (no API cost)
3. Memory Cache check        →  hit: return cached (no API cost)
4. Parallel AI Search        →  Grok + Gemini + OpenRouter run simultaneously
5. Deduplicate & Rank        →  weighted score (rating, reviews, price, stock, delivery)
6. AI Aggregation            →  OpenRouter picks Best Overall/Value/Premium/Budget
7. Cache results             →  1 hour Redis + 30 min memory
8. Store embeddings          →  async, non-blocking, for future RAG hits
```

### Ranking Algorithm (weighted score)

| Factor | Weight |
|--------|--------|
| Rating (0-5) | 40 pts |
| Review count | 20 pts |
| In-stock availability | 15 pts |
| Discount percentage | 15 pts |
| Delivery speed | 10 pts |

---

## 🔒 Security

- **Helmet.js** — HTTP security headers
- **CORS** — Restricted to configured client URL
- **Rate limiting** — Global (100/15min), Auth (10/15min), Search (30/min)
- **JWT rotation** — 15-minute access tokens + 7-day refresh tokens with single-use invalidation
- **Prompt injection guard** — Regex pattern matching against 15+ injection techniques
- **Input validation** — Zod schemas on all endpoints
- **Password hashing** — bcrypt with cost factor 12

---

## 🧪 Testing

```bash
cd server
npm test
```

Tests cover:
- Auth registration + login + duplicate detection
- Prompt injection blocking
- Cache key normalization
- Protected route enforcement
- Health check endpoint

---

## 📈 Performance

- **Parallel requests** — `Promise.allSettled()` runs all 3 AI calls simultaneously
- **Request queue** — `p-queue` (concurrency 3) prevents API abuse
- **Retry logic** — `axios-retry` with exponential backoff on 429/503
- **Debounced search** — 500ms frontend debounce prevents over-firing
- **React optimization** — `memo`, `useMemo`, `useCallback`, `lazy/Suspense`, code splitting
- **Cache hit rates** — RAG + Redis + memory cache reduces live AI calls significantly

---

## 🔑 Getting API Keys

| Service | Where | Used For |
|---------|-------|----------|
| **Grok** | https://x.ai/api | Amazon search analysis |
| **Gemini** | https://aistudio.google.com | Flipkart search analysis |
| **OpenRouter** | https://openrouter.ai | Global search + aggregation |

All three can be obtained for free with usage limits.

---

## 📄 License

MIT — free to use and modify.

---

> **Note:** This platform uses AI to simulate and analyze product data based on LLM knowledge. For production use with real pricing and inventory, integrate official retailer APIs (Amazon Product Advertising API, Flipkart Affiliate API, BestBuy API, Walmart Open API) to replace AI-generated data with live feeds.
