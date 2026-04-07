# 🏥 Drug Delivery E-commerce Platform - Microservices Edition

A **production-grade, scalable fullstack application** for online prescription dispensing and medicine delivery. Built with microservices architecture, API Gateway pattern, and enterprise-level features.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [Microservices Overview](#microservices-overview)
8. [Advanced Features](#advanced-features)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## 🏗️ System Architecture

### Architecture Diagram

The platform uses a **microservices architecture** with an **API Gateway pattern**:

```
┌─────────────────────────────────────┐
│    React Frontend (Port 3000)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  API Gateway (Port 4000)            │
│  - Auth validation                  │
│  - Request routing                  │
│  - Rate limiting                    │
│  - Logging                          │
└──┬──┬──┬──┬──┬──┐────────────────────┘
   │  │  │  │  │  │
   ▼  ▼  ▼  ▼  ▼  ▼
  ┌──────────────────────────────────┐
  │     MICROSERVICES                │
  │ ├─ Auth (5001)                   │
  │ ├─ User (5002)                   │
  │ ├─ Medicine (5003)               │
  │ ├─ Prescription (5004)           │
  │ ├─ Order (5005)                  │
  │ └─ Delivery (5006)               │
  └──────────────┬─────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │  Redis   │
    │          │    │          │
    └──────────┘    └──────────┘
```

### Key Design Patterns

#### 1. **API Gateway Pattern**
- Single entry point for all client requests
- Centralized authentication (JWT validation)
- Request routing to microservices
- Rate limiting and logging
- Error handling and response normalization

#### 2. **Microservices Architecture**
Each service is independently deployable and scalable:

| Service | Port | Responsibility |
|---------|------|---|
| **Auth Service** | 5001 | JWT generation, user registration/login, RBAC |
| **User Service** | 5002 | Profile management, addresses |
| **Medicine Service** | 5003 | CRUD operations, search, stock, Redis caching |
| **Prescription Service** | 5004 | Upload, approval workflow, validation |
| **Order Service** | 5005 | Order lifecycle, payment, stock transactions |
| **Delivery Service** | 5006 | Delivery tracking, agent assignment |

#### 3. **Circuit Breaker Pattern**
- Prevents cascading failures
- Auto-recovery with exponential backoff
- States: CLOSED → OPEN (after 3 failures) → HALF_OPEN (after timeout) → CLOSED

#### 4. **Transaction Management**
- Database-level ACID compliance for order creation
- Idempotent order endpoints (prevent duplicate orders)
- Automatic rollback on payment failure

#### 5. **Caching Strategy (Redis)**
- Medicine list cache (TTL: 1 hour)
- Individual medicine detail cache (TTL: 30 minutes)
- Stock reservation cache (TTL: 10 minutes)
- Rate limiting counters
- JWT blacklist for logout

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (RDBMS)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **Validation**: Express-validator

### Frontend
- **Framework**: React.js (Hooks-based)
- **HTTP Client**: Axios / React Query
- **State Management**: React Context / Redux
- **Styling**: CSS/Tailwind

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (local), Kubernetes (production)
- **Logging**: Winston / Morgan
- **Monitoring**: Health checks, request logging

---

## 📁 Project Structure

```
drug-delivery/
├── api-gateway/                    # API Gateway (Port 4000)
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT validation
│   │   │   ├── rateLimiter.middleware.js # Rate limiting
│   │   │   ├── logger.middleware.js     # Request logging
│   │   │   └── error.middleware.js      # Error handling
│   │   ├── utils/
│   │   │   └── serviceClient.js         # Service communication with circuit breaker
│   │   ├── routes/
│   │   │   └── index.js                 # All API routes
│   │   └── index.js                     # Main app
│   ├── package.json
│   ├── .env.example
│   └── logs/                            # Request & error logs
│
├── services/
│   │
│   ├── auth-service/                 # Port 5001
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── authController.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   ├── repositories/
│   │   │   │   └── authRepository.js
│   │   │   ├── middleware/
│   │   │   │   └── validation.js
│   │   │   ├── routes/
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── user-service/                 # Port 5002
│   ├── medicine-service/             # Port 5003
│   ├── prescription-service/         # Port 5004
│   ├── order-service/                # Port 5005
│   └── delivery-service/             # Port 5006
│
├── frontend/                         # React App (Port 3000)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.js               # Axios API client
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.js
│   ├── package.json
│   └── .env.example
│
├── shared/                           # Shared utilities
│   ├── database.js                  # PostgreSQL connection pool
│   └── .env.example
│
├── docs/
│   ├── ARCHITECTURE.md              # System design document
│   ├── DATABASE_SCHEMA.sql          # Database schema & sql
│   ├── API_DOCUMENTATION.md         # API endpoints
│   └── DEPLOYMENT_GUIDE.md          # DevOps guide
│
├── docker-compose.yml               # Local dev environment
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

```bash
# Required
- Node.js >= 16
- npm or yarn
- PostgreSQL >= 12
- Redis >= 6
- Docker & Docker Compose (for containerized setup)
```

### Step 1: Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd drug-delivery

# Install API Gateway dependencies
cd api-gateway
npm install

# Install each microservice
cd ../services/auth-service
npm install

cd ../user-service
npm install

cd ../medicine-service
npm install

# ... repeat for other services

# Install frontend dependencies
cd ../../frontend
npm install
```

### Step 2: Setup Environment Variables

```bash
# Create .env files from examples
cp api-gateway/.env.example api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
# ... repeat for other services

# Edit .env files with your configuration
```

### Step 3: Setup PostgreSQL Database

```bash
# Create database
createdb drug_delivery_db

# Run schema script
psql -U postgres drug_delivery_db < docs/DATABASE_SCHEMA.sql

# Verify tables
psql -U postgres drug_delivery_db -c "\dt"
```

### Step 4: Start Services Locally

**Option A: Using npm (Multiple Terminal Windows)**

```bash
# Terminal 1: Start API Gateway
cd api-gateway
npm run dev

# Terminal 2: Start Auth Service
cd services/auth-service
npm run dev

# Terminal 3: Start Medicine Service
cd services/medicine-service
npm run dev

# ... and so on for other services

# Terminal N: Start Frontend
cd frontend
npm start
```

**Option B: Using Docker Compose (Recommended)**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Stop all services
docker-compose down
```

### Step 5: Verify System is Running

```bash
# Check API Gateway health
curl http://localhost:4000/health

# Check Auth Service
curl http://localhost:5001/health

# Frontend
open http://localhost:3000
```

---

## 🗄️ Database Design

### Key Tables

#### `users`
Stores user credentials and profile information.

```sql
Column        | Type      | Constraints
--------------+-----------+---------------------
id            | SERIAL    | PRIMARY KEY
email         | VARCHAR   | UNIQUE, NOT NULL
password      | VARCHAR   | NOT NULL (hashed)
name          | VARCHAR   | NOT NULL
role          | VARCHAR   | user/admin/pharmacist
created_at    | TIMESTAMP | DEFAULT NOW()
```

**Indexes**:
- `idx_users_email` - Fast lookups by email
- `idx_users_role` - Filter by role (admin queries)

#### `medicines`
Catalog of available medicines.

```sql
Column                 | Type     | Constraints
-----------+-----------+---------+-----
id         | SERIAL    | PK
name       | VARCHAR   | NOT NULL
price      | DECIMAL   | > 0
quantity_in_stock | INT | >= 0
requires_prescription | BOOLEAN | Default false
expiry_date | DATE    | Can be NULL
```

**Indexes**:
- `idx_medicines_stock` - Quick stock checks
- `idx_medicines_requires_prescription` - Filter prescription items

#### `orders`
Order records with payment and status tracking.

```sql
Column              | Type      | Constraints
--------------------+----------+-------------------------
id                  | SERIAL    | PRIMARY KEY
user_id             | INT       | NOT NULL, FK → users
status              | VARCHAR   | pending/paid/shipped/delivered
payment_status      | VARCHAR   | pending/completed/failed
total_amount        | DECIMAL   | > 0
idempotency_key    | VARCHAR   | UNIQUE (prevent duplicates)
created_at         | TIMESTAMP | DEFAULT NOW()
```

**Indexes**:
- `idx_orders_user_id` - User's order history
- `idx_orders_status` - Filter by order status
- `idx_orders_idempotency_key` - Prevent duplicate orders

#### `order_items`
Line items in an order (many-to-one with orders).

```sql
Column                    | Type    | Constraints
--------------------------+---------+-------------------
id                        | SERIAL  | PRIMARY KEY
order_id                  | INT     | FK → orders
medicine_id               | INT     | FK → medicines
quantity                  | INT     | > 0
price_at_purchase         | DECIMAL | Price when ordered
requires_prescription_id   | INT     | FK → prescriptions
```

#### `prescriptions`
User prescriptions for restricted medicines.

```sql
Column              | Type      | Constraints
--------------------+-----------+---------------------
id                  | SERIAL    | PRIMARY KEY
user_id             | INT       | FK → users
file_url            | VARCHAR   | Path to  prescription file
status              | VARCHAR   | pending/approved/rejected
approved_by_id      | INT       | FK → users (pharmacist)
created_at          | TIMESTAMP | DEFAULT NOW()
expires_at          | TIMESTAMP | Prescription validity
```

#### `deliveries`
Tracks delivery status and agent assignment.

```sql
Column                  | Type      | Constraints
------------------------+-----------+------------------
id                      | SERIAL    | PRIMARY KEY
order_id                | INT       | FK → orders
delivery_agent_id       | INT       | FK → users
status                  | VARCHAR   | assigned/in_transit/delivered
estimated_delivery_date | DATE      | ETA
actual_delivery_date    | DATE      | Actual delivery date
```

### Indexing Strategy

**High-Query Operations**:
1. **User login**: `SELECT * FROM users WHERE email = ?`
   - Index: `idx_users_email`
   - Expected latency: < 1ms

2. **Get user orders**: `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
   - Index: `idx_orders_user_id`
   - Expected latency: < 10ms

3. **Check stock**: `SELECT quantity_in_stock FROM medicines WHERE id = ?`
   - Index: Primary key
   - Expected latency: < 1ms

4. **Medicine search**: `SELECT * FROM medicines WHERE name ILIKE ?`
   - Index: (full-text search index recommended for production)
   - Expected latency: < 50ms

### Concurrency & Transaction Handling

#### Stock Update (Prevent Overselling)

```javascript
// Example: Order Service
const transaction = await db.transaction(async (client) => {
  // Lock medicine row to prevent concurrent updates
  const medicine = await client.query(
    'SELECT * FROM medicines WHERE id = $1 FOR UPDATE',
    [medicineId]
  );

  // Check if stock is available
  if (medicine.rows[0].quantity_in_stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Atomically update stock
  await client.query(
    'UPDATE medicines SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2',
    [quantity, medicineId]
  );

  // Create order...
});
```

#### Payment Failure Rollback

```javascript
try {
  await transaction(async (client) => {
    // 1. Create order
    const order = await createOrder(client, ...);
    
    // 2. Reserve stock
    await reserveStock(client, ...);
    
    // 3. Process payment (external service)
    const paymentResult = await processPayment(order.id);
    
    if (!paymentResult.success) {
      throw new PaymentError('Payment failed');
    }
    
    // All successful, transaction commits
  });
} catch (error) {
  // Automatic rollback: order, stock, etc. all undone
  console.error('Order failed, rolled back:', error);
}
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "..."
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "..."
  }
}
```

### Medicine Endpoints

#### Get All Medicines (Cached)
```http
GET /api/medicines

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Aspirin 100mg",
      "price": 5.99,
      "quantity_in_stock": 100,
      "requires_prescription": false
    }
  ]
}
```

#### Search Medicines
```http
GET /api/medicines/search?name=aspirin&requires_prescription=false

Response: Filtered list matching criteria
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "items": [
    {
      "medicine_id": 1,
      "quantity": 2
    }
  ],
  "shipping_address_id": 1,
  "idempotency_key": "unique-key-12345"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 100,
    "status": "pending",
    "total_amount": 11.98,
    "items": [...]
  }
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <ACCESS_TOKEN>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 100,
      "status": "delivered",
      "total_amount": 11.98,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Prescription Endpoints

#### Upload Prescription
```http
POST /api/prescriptions/upload
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: multipart/form-data

Form Data:
- file: <prescription-image.jpg>
- medicine_id: 5 (optional, which medicine does this allow)

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "file_url": "s3://prescriptions/...",
    "status": "pending",
    "created_at": "..."
  }
}
```

#### Approve Prescription (Admin/Pharmacist)
```http
PUT /api/prescriptions/{id}/approve
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "approval_notes": "Prescription verified"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "approved_by_id": 2,
    "approval_date": "..."
  }
}
```

---

## 🎯 Microservices Overview

### Auth Service (Port 5001)

**Responsibilities**:
- User registration with validation
- User login with password verification
- JWT token generation (access + refresh)
- Token refresh mechanism
- RBAC (Role-Based Access Control)

**Key Features**:
- Bcrypt password hashing (10 salt rounds)
- JWT expiry: 15 minutes (access), 7 days (refresh)
- Blacklist tokens on logout (Redis)
- Email validation regex

**Database**:
- `users` table

**Example Request**:
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

---

### Medicine Service (Port 5003)

**Responsibilities**:
- CRUD operations on medicines
- Search and filtering
- Stock management
- Expiry date handling

**Advanced Features**:
- Redis caching (medicines:all, medicine:{id})
- Cache invalidation on CREATE/UPDATE/DELETE
- Stock availability checks
- Search by name, manufacturer, requires_prescription

**Caching Strategy**:
```
GET /medicines
├─ Check Redis cache (medicine:all)
├─ If hit: Return cached data
└─ If miss:
   ├─ Query PostgreSQL
   ├─ Cache result (TTL: 1 hour)
   └─ Return data
```

**Database**:
- `medicines` table

---

### Order Service (Port 5005)

**Responsibilities**:
- Order creation and lifecycle management
- Payment processing integration
- Stock reserved with transactions
- Order status tracking
- Delivery assignment

**Complex Features**:
- **Idempotency**: `idempotency_key` prevents duplicate orders
- **Transactions**: Atomic order creation + stock update
- **Payment Handling**: Rollback on failure
- **Concurrency**: SELECT...FOR UPDATE locks for stock safety

**Order States**:
```
pending → (payment) → paid → shipped → delivered
                  ↓
               failed (rollback)
```

**Example Transaction Flow**:
```javascript
BEGIN;
  INSERT INTO orders (...) RETURNING id;
  UPDATE medicines SET quantity_in_stock = ... WHERE id = ... FOR UPDATE;
  INSERT INTO order_items (...);
  -- Payment processing
  IF payment_failed THEN
    ROLLBACK;
  ELSE
    COMMIT;
  END IF;
END;
```

---

### Prescription Service (Port 5004)

**Responsibilities**:
- Prescription file upload (multipart/form-data)
- File storage (local path or S3 URL)
- Approval workflow (admin/pharmacist review)
- Prescription validation for orders

**Approval States**:
```
pending → approved (order allowed)
       → rejected (order denied)
```

**File Handling**:
- Multer middleware for file upload
- Validation: JPG, PNG, PDF only
- Storage: `/uploads/prescriptions/` or AWS S3
- Virus scan recommended for production

---

### Delivery Service (Port 5006)

**Responsibilities**:
- Delivery agent assignment
- Delivery status tracking
- Estimated delivery date management
- Real-time delivery tracking

**Delivery States**:
```
assigned → in_transit → delivered
        → attempted  → failed
```

---

## 🚀 Advanced Features

### 1. Circuit Breaker Pattern

Prevents cascading failures when services are down.

```javascript
// serviceClient.js
circuitBreakerState[serviceName] = {
  state: 'CLOSED',      // Normal operation
  failureCount: 0,
  resetTimeout: 30000
};

// After 3 failures → state = 'OPEN'
// After 30 seconds → state = 'HALF_OPEN' (test recovery)
// If successful → state = 'CLOSED'
```

**Benefits**:
- Fast failure: Return 503 instead of waiting for timeout
- Self-healing: Automatic recovery attempt
- Status visibility: Know when services are down

### 2. Rate Limiting

Prevents abuse and ensures fair resource usage.

```javascript
// Global limit: 100 req/min per IP
globalLimiter: 100 requests per 60 seconds

// Auth limit: 5 login attempts per 15 minutes
authEndpointLimiter: 5 requests per 900 seconds

// Per-user limit: 200 req/min for authenticated users
authenticatedUserLimiter: 200 requests per 60 seconds
```

**Implementation**:
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const userLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 1 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

### 3. Distributed Transactions

Handles multi-step operations with rollback capability.

```javascript
// Order creation with stock management
const order = await db.transaction(async (client) => {
  // Step 1: Create order
  const orderResult = await client.query(
    'INSERT INTO orders (...) RETURNING *'
  );
  
  // Step 2: Reserve stock (with lock)
  await client.query(
    'UPDATE medicines SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 FOR UPDATE',
    [quantity, medicineId]
  );
  
  // Step 3: Process payment (external)
  const payment = await processPayment(...);
  
  // Step 4: Assign delivery
  await client.query('INSERT INTO deliveries (...)');
  
  // If any step fails → automatic ROLLBACK
  return orderResult.rows[0];
});
```

### 4. Caching with Invalidation

Redis-based caching for hot data.

```javascript
// Cache medicine list
KEY: medicines:all
VALUE: JSON array of medicines
TTL: 3600 seconds (1 hour)

// On CREATE/UPDATE/DELETE medicine
INVALIDATE: medicines:all (delete key)

// Cache individual medicine
KEY: medicine:{id}
VALUE: Medicine object
TTL: 1800 seconds (30 minutes)

// Stock reservation (temporary)
KEY: stock:reserved:{medicine_id}
VALUE: Quantity reserved
TTL: 600 seconds (10 min)
```

### 5. Idempotency

Prevents duplicate orders from retry requests.

```javascript
// Client sends:
POST /api/orders
{
  "items": [...],
  "idempotency_key": "unique-uuid-12345"
}

// Database constraint:
UNIQUE(idempotency_key)

// If same key is sent again:Database returns existing order instead of creating new one
```

### 6. Request Logging & Tracing

Structured logging for debugging and monitoring.

```javascript
// Logs stored in ./api-gateway/logs/
├── access.log      // All HTTP requests (Morgan)
├── info.log        // Application info
├── error.log       // Error stack traces
└── [other].log

// Each log entry includes:
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "API Request",
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 201,
  "duration": "245ms",
  "userId": 123
}
```

---

## 🐳 Deployment

### Local Development (Docker Compose)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Production Deployment (Kubernetes)

```bash
# Build Docker images
docker build -t registry.example.com/api-gateway ./api-gateway
docker build -t registry.example.com/auth-service ./services/auth-service
# ... build other services

# Push to registry
docker push registry.example.com/api-gateway

# Deploy to Kubernetes
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/auth-service-deployment.yaml
# ... deploy other services

# Check status
kubectl get deployments
kubectl get pods
kubectl logs <pod-name>
```

### Environment-Specific Configuration

```
Development (.env.development):
- NODE_ENV=development
- JWT_SECRET=dev-secret
- LOG_LEVEL=debug
- DB_HOST=localhost

Staging (.env.staging):
- NODE_ENV=staging
- JWT_SECRET=staging-secret
- LOG_LEVEL=info
- DB_HOST=staging-db.example.com

Production (.env.production):
- NODE_ENV=production
- JWT_SECRET=<use AWS Secrets Manager>
- LOG_LEVEL=warn
- DB_HOST=prod-db.example.com
```

---

## 🔒 Security Considerations

### 1. JWT Security
- ✅ Short expiry (15 min access token)
- ✅ Refresh token for extending (7 days)
- ✅ Token blacklist on logout
- ✅ Verified signature at API Gateway

### 2. Password Security
- ✅ Bcrypt hashing (10 salt rounds)
- ✅ Password requirements: 8+ chars, uppercase, lowercase, number
- ✅ Never return plaintext passwords

### 3. SQL Injection Protection
- ✅ Parameterized queries (pg module)
- ✅ Input validation (express-validator)
- ✅ ORM sanitization

### 4. Rate Limiting
- ✅ Prevent brute force: 5 login attempts per 15 min
- ✅ Prevent DDoS: 100 req /min per IP (global)
- ✅ Per-user limits: 200 req/min for authenticated

### 5. CORS
- ✅ Whitelist frontend domain
- ✅ Credentials mode enabled
- ✅ Prevent unauthorized cross-origin requests

### 6. HTTPS (Production)
- ✅ Use SSL/TLS certificates
- ✅ Secure cookie flags: `Secure`, `HttpOnly`
- ✅ Redirect HTTP to HTTPS

---

## 📞 Support & Contributing

### Contributing Guidelines
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Issue Reporting
- Use GitHub Issues for bugs and feature requests
- Include:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Logs/error messages
  - Environment (OS, Node version, etc.)

### Development Setup
```bash
# Install dev dependencies
npm install --save-dev nodemon prettier eslint

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

Built with production-grade best practices in mind:
- Enterprise architecture patterns
- Real-world edge case handling
- Scalability & fault tolerance focus
- Professional code organization
- Comprehensive documentation

---

**Last Updated**: April 2026
**Status**: Production-Ready ✅
**Maintenance**: Actively Maintained
