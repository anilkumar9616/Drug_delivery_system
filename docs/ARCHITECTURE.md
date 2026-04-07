# Drug Delivery E-commerce Platform - System Architecture

## 🏗️ High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React.js Frontend (Hooks-based)                         │   │
│  │  - Login/Register, Medicine Listing, Cart, Orders        │   │
│  │  - Protected Routes, Role-based UI                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                    (Port 4000)                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Gateway Features:                                   │   │
│  │  ✓ Central Request Entry Point                           │   │
│  │  ✓ JWT Authentication Validation (middleware)            │   │
│  │  ✓ Request Routing to Microservices                      │   │
│  │  ✓ Rate Limiting (Express-rate-limit)                    │   │
│  │  ✓ Request/Response Logging                              │   │
│  │  ✓ Error Handling & Response Normalization               │   │
│  │  ✓ CORS Management                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ↓              ↓              ↓              ↓              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES LAYER                             │
│                                                                      │
│  Service-to-Service Communication (HTTP/gRPC)                       │
│  Each service independently scalable                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🔐 AUTH SERVICE (Port 5001)                               │   │
│  │  ├─ JWT Token Generation/Validation                        │   │
│  │  ├─ User Registration & Login                              │   │
│  │  ├─ Refresh Token Management                               │   │
│  │  └─ RBAC (Role-Based Access Control)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  👤 USER SERVICE (Port 5002)                               │   │
│  │  ├─ User Profile Management                                │   │
│  │  ├─ Address Management                                     │   │
│  │  └─ User Data (stored in PostgreSQL)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  💊 MEDICINE SERVICE (Port 5003)                           │   │
│  │  ├─ CRUD Operations (medicines table)                      │   │
│  │  ├─ Search & Filtering                                     │   │
│  │  ├─ Stock Management                                       │   │
│  │  ├─ Expiry Date Handling                                   │   │
│  │  ├─ Cache Integration (Redis)                              │   │
│  │  └─ Requires Prescription Check                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📄 PRESCRIPTION SERVICE (Port 5004)                       │   │
│  │  ├─ Prescription Upload (file storage)                     │   │
│  │  ├─ Admin/Pharmacist Approval Workflow                     │   │
│  │  ├─ Status Management (pending/approved/rejected)          │   │
│  │  └─ Validation (only approved = order allowed)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📦 ORDER SERVICE (Port 5005)                              │   │
│  │  ├─ Order Lifecycle Management                             │   │
│  │  │  (pending → paid → shipped → delivered)                 │   │
│  │  ├─ Stock Validation & Reservation                         │   │
│  │  ├─ Payment Integration                                    │   │
│  │  ├─ Idempotency (prevent duplicate orders)                 │   │
│  │  ├─ DB Transactions (ACID compliance)                      │   │
│  │  ├─ Rollback on Payment Failure                            │   │
│  │  └─ Calls: Medicine, Prescription, Delivery Services       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🚚 DELIVERY SERVICE (Port 5006)                           │   │
│  │  ├─ Delivery Agent Assignment                              │   │
│  │  ├─ Delivery Status Tracking                               │   │
│  │  ├─ Delivery Timeline Management                           │   │
│  │  └─ Integration with Order Service                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
        ↓                          ↓                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA & CACHE LAYER                             │
│                                                                      │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐  │
│  │   PostgreSQL (Port 5432) │    │   Redis Cache (Port 6379)    │  │
│  │  ───────────────────────  │    │  ──────────────────────────  │  │
│  │  ✓ users table           │    │  ✓ Medicine List (Cached)    │  │
│  │  ✓ medicines table       │    │  ✓ Session Store             │  │  
│  │  ✓ prescriptions table   │    │  ✓ Rate Limit Counters       │  │
│  │  ✓ orders table          │    │  ✓ JWT Blacklist             │  │
│  │  ✓ order_items table     │    │  ✓ User Sessions             │  │
│  │  ✓ deliveries table      │    │                              │  │
│  │  ✓ Transactions (ACID)   │    │  TTL: Smart invalidation     │  │
│  │  ✓ Indexing Strategy     │    │                              │  │
│  └──────────────────────────┘    └──────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Request Flow Through API Gateway

### Example: Order Creation Flow

```
1. Client Request
   ↓
   POST /api/orders
   Headers: { Authorization: "Bearer JWT_TOKEN" }
   
2. API Gateway Middleware Chain
   ├─ CORS Check
   ├─ Rate Limiting (check Redis counter)
   ├─ Request Logging
   ├─ JWT Validation Middleware
   │  └─ Verify token signature & expiry
   │  └─ Extract user_id & role
   └─ Authorization Check (role = "user")
   
3. Routing to Order Service
   ├─ Extract order details from request
   ├─ Forward to Order Service (http://order-service:5005/orders)
   └─ Attach authenticated user context
   
4. Order Service Processing
   ├─ Validate order items (call Medicine Service)
   ├─ Check prescription approval (call Prescription Service)
   ├─ Begin DB Transaction
   ├─ Create order record (status: pending)
   ├─ Reserve stock in medicine table
   ├─ Process payment
   │  ├─ If SUCCESS: Commit transaction
   │  └─ If FAILED: Rollback transaction & stock
   ├─ Assign delivery (call Delivery Service)
   └─ Return response
   
5. API Gateway Response Processing
   ├─ Receive response from microservice
   ├─ Add response headers (X-Request-ID, timing)
   ├─ Return to client
```

---

## 🔄 Inter-Service Communication Pattern

### Service-to-Service Calls:

```
Order Service needs data from:

1. Medicine Service
   - Validate stock is available
   - Get current prices
   - Check if requires_prescription = true
   
   HTTP Call: GET http://medicine-service:5003/medicines/{id}
   Internal Auth: Service-to-service token (optional, can use same JWT)

2. Prescription Service
   - Verify prescription is approved for user
   - Get prescription details
   
   HTTP Call: GET http://prescription-service:5004/prescriptions/{prescription_id}

3. Delivery Service
   - Create delivery record for the order
   - Assign delivery agent
   
   HTTP Call: POST http://delivery-service:5006/deliveries
   Body: { order_id, address, delivery_type }

Error Handling:
- Timeout: 5 seconds per service call
- Retry Logic: Exponential backoff (1s, 2s, 4s)
- Circuit Breaker: Fail fast if service is down
```

---

## 🌍 Where Redis is Used

```
┌─────────────────────────────────────────┐
│     Redis Cache Usage Strategy           │
├─────────────────────────────────────────┤
│                                          │
│ 1. Medicine List Caching                │
│    Key: medicines:all                   │
│    Value: JSON array of medicines       │
│    TTL: 1 hour                          │
│    Invalidate: On CREATE/UPDATE/DELETE  │
│                                          │
│ 2. Individual Medicine Cache            │
│    Key: medicine:{id}                   │
│    Value: Medicine object               │
│    TTL: 30 minutes                      │
│                                          │
│ 3. User Session Store                   │
│    Key: session:{session_id}            │
│    Value: User context                  │
│    TTL: 24 hours (or JWT expiry)        │
│                                          │
│ 4. Rate Limiting Counters               │
│    Key: ratelimit:{user_id}:{endpoint}  │
│    Value: Request count                 │
│    TTL: 1 minute                        │
│    Max: 100 requests/minute              │
│                                          │
│ 5. JWT Blacklist (Logout)               │
│    Key: blacklist:{token_hash}          │
│    Value: true                          │
│    TTL: Token expiry time               │
│                                          │
│ 6. Stock Reservation                    │
│    Key: stock:reserved:{medicine_id}    │
│    Value: Quantity reserved             │
│    TTL: 10 minutes (order timeout)      │
│                                          │
└─────────────────────────────────────────┘
```

---

## ⚠️ Failure Handling & Resilience

### Scenario 1: Payment Service Fails

```
Order Service Processing:
  1. Begin transaction
  2. Create order (status: pending)
  3. Reserve stock
  4. Call Payment Service → TIMEOUT/ERROR
  5. Catch error
  6. Rollback transaction
  7. Release stock reservation
  8. Return error to client
  
No data corruption ✓
No overselling ✓
```

### Scenario 2: Medicine Service is Down

```
Order Service:
  1. Call Medicine Service with timeout (5s)
  2. No response within 5s
  3. Circuit Breaker opens
  4. Return error: "Service temporarily unavailable"
  5. Retry after 30 seconds
  6. If still down, fail the order

Benefits:
  - Prevents cascading failures
  - Fast failure response (don't wait indefinitely)
  - Automatic recovery attempt
```

### Scenario 3: Database Connection Pool Exhausted

```
Each Service has:
  - Pool size: 20 connections
  - Max overflow: 5
  
Action:
  1. New request comes in
  2. No connections available
  3. Queue the request (up to 10 in queue)
  4. Return 503 (Service Unavailable) if queue full
  5. Client backs off & retries
```

---

## 🔐 Authentication Flow in API Gateway

```
┌──────────────────────────────────────────────┐
│  Request Flow with JWT Authentication        │
├──────────────────────────────────────────────┤
│                                              │
│  1. Client sends request with JWT           │
│     Header: { Authorization: Bearer TOKEN } │
│                                              │
│  2. API Gateway Middleware:                 │
│     ├─ Extract token from header            │
│     ├─ Check if token is blacklisted (Redis)│
│     ├─ Verify signature using SECRET_KEY    │
│     ├─ Check expiry time                    │
│     ├─ Decode payload to get user_id, role │
│     ├─ Attach to request.user               │
│     └─ Pass to next middleware              │
│                                              │
│  3. Authorization Middleware:                │
│     ├─ Check if route requires auth         │
│     ├─ Check required roles                 │
│     ├─ If unauthorized: Return 403          │
│     └─ Otherwise: Proceed to service        │
│                                              │
│  4. Service receives authenticated request  │
│     ├─ user_id from req.user.id             │
│     ├─ role from req.user.role              │
│     └─ Can safely use for DB queries        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 📋 Microservices Overview

| Service | Port | Responsibility | Tech Stack |
|---------|------|-----------------|-----------|
| API Gateway | 4000 | Routing, Auth, Rate limit | Express, JWT, rate-limit |
| Auth Service | 5001 | Auth, Token generation | Express, bcrypt, jsonwebtoken |
| User Service | 5002 | User profile, addresses | Express, PostgreSQL |
| Medicine Service | 5003 | Medicines, Stock | Express, PostgreSQL, Redis |
| Prescription Service | 5004 | Prescription upload, Approval | Express, PostgreSQL, multer |
| Order Service | 5005 | Orders, Payment, Stock | Express, PostgreSQL, Transactions |
| Delivery Service | 5006 | Delivery tracking | Express, PostgreSQL |

---

## 🎯 Key Design Decisions

### 1. **API Gateway Pattern**
- Single entry point for all clients
- Centralized auth check (faster than service-level checks)
- Easy to add/remove services without client changes

### 2. **Database Per Service** (Optional)
- Currently using shared PostgreSQL (easier to start)
- Can migrate to independent DBs as system grows
- Joins between services: Handled via API calls

### 3. **Synchronous Communication**
- HTTP REST for inter-service calls
- Simple, easier to debug, good for RPC-like calls
- Alternative: Message queues (RabbitMQ/Kafka) for async

### 4. **Redis for Caching Only**
- Not for session store (PostgreSQL sessions work fine)
- Used for read-heavy operations (medicine list)
- TTL invalidation strategy (simple, not event-based)

### 5. **Transaction Handling**
- DB transactions in Order Service (critical)
- Distributed transactions: Use saga pattern if needed later
- Per-service consistency (no 2PC)

### 6. **Error Handling Strategy**
- Standardized error responses (code, message, details)
- Logging at each layer (request, business logic, error)
- No sensitive data in error messages

---

## 📈 Scalability Considerations

### Horizontal Scaling:
- Each service can be deployed independently
- Load balancer in front of API Gateway
- Multiple instances per service (container orchestration)
- Sticky sessions: RoundRobin + JWT (stateless)

### Database Scaling:
- Read replicas for Medicine Service
- Connection pooling (essential)
- Query indexing strategy (covered in schema design)

### Caching Strategy:
- Cache invalidation on writes (TTL or event-based)
- Cache-aside pattern (check cache, fallback to DB)

### Rate Limiting:
- Per-user limits (100 requests/min)
- Per-endpoint limits (adjust as needed)
- Distributed rate limiting using Redis

---

## 🛡️ Security Considerations

1. **JWT Security**
   - Short expiry (15 min access token)
   - Refresh token for extending sessions
   - Blacklist on logout

2. **Password Security**
   - Bcrypt with salt rounds = 10
   - Never return plain passwords

3. **SQL Injection**
   - Parameterized queries (always use prepared statements)
   - ORM validation (if using ORM)

4. **CORS**
   - Whitelist frontend domain
   - Allow credentials: true for auth flow

5. **Rate Limiting**
   - Prevent brute force attacks
   - Prevent DDoS

6. **HTTPS**
   - Use in production (with SSL certs)
   - Secure cookie flags

---

End of Architecture Document
