# Complete Setup & Deployment Guide

## 🎯 Quick Summary

This is a **production-grade fullstack Drug Delivery E-commerce Platform** with:
- ✅ 6 Microservices (Node.js/Express)
- ✅ PostgreSQL Database with 10 tables
- ✅ Redis Cache
- ✅ API Gateway with routing & rate limiting
- ✅ React Frontend with complete UI
- ✅ Docker containerization
- ✅ Comprehensive documentation

---

## 📋 System Architecture

```
User → React Frontend (Port 3000)
         ↓
   API Gateway (Port 4000)
         ↓
   ┌─────────────────────────────────────────┐
   │ Microservices (Ports 5001-5006)        │
   │ • Auth Service (5001)                   │
   │ • User Service (5002)                   │
   │ • Medicine Service (5003)               │
   │ • Prescription Service (5004)           │
   │ • Order Service (5005)                  │
   │ • Delivery Service (5006)               │
   └─────────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────────┐
   │ Data Layer                              │
   │ • PostgreSQL (Port 5432)                │
   │ • Redis (Port 6379)                     │
   └─────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js v14+ and npm v6+
- PostgreSQL v12+
- Redis v6+
- Docker & Docker Compose (optional, for easy setup)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Navigate to project root
cd drug-delivery

# 2. Start all services
docker-compose up -d

# 3. Services will be ready in 30-60 seconds

# 4. Frontend starts automatically or:
cd frontend
npm install
npm start
```

**Services will be available at:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- All microservices running in containers

### Option 2: Manual Setup

#### Step 1: Database Setup

```bash
# Start PostgreSQL
# On Windows (if using Windows Subsystem):
postgres -D "C:\Program Files\PostgreSQL\14\data"

# On Mac/Linux:
brew services start postgresql

# Create database
createdb drug_delivery_db

# Run schema
psql -U postgres -d drug_delivery_db -f db_schema.sql
```

#### Step 2: Redis Setup

```bash
# Start Redis
# On Windows (if using Windows Subsystem):
redis-server

# On Mac:
brew services start redis

# On Linux:
redis-server
```

#### Step 3: Backend Services

```bash
# Terminal 1: API Gateway
cd api-gateway
npm install
npm start
# Should see: "✓ API Gateway listening on port 4000"

# Terminal 2: Auth Service
cd services/auth-service
npm install
npm start
# Should see: "✓ Auth Service running on port 5001"

# Terminal 3: User Service
cd services/user-service
npm install
npm start
# Should see: "✓ User Service running on port 5002"

# Terminal 4: Medicine Service
cd services/medicine-service
npm install
npm start
# Should see: "✓ Medicine Service running on port 5003"

# Terminal 5: Prescription Service
cd services/prescription-service
npm install
npm start
# Should see: "✓ Prescription Service running on port 5004"

# Terminal 6: Order Service
cd services/order-service
npm install
npm start
# Should see: "✓ Order Service running on port 5005"

# Terminal 7: Delivery Service
cd services/delivery-service
npm install
npm start
# Should see: "✓ Delivery Service running on port 5006"
```

#### Step 4: Frontend

```bash
# Terminal 8: React Frontend
cd frontend
npm install
npm start
# Should open http://localhost:3000 automatically
```

---

## 📁 Project Structure

```
drug-delivery/
├── api-gateway/                    # Central routing & auth
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
│
├── services/                       # 6 Microservices
│   ├── auth-service/
│   ├── user-service/
│   ├── medicine-service/
│   ├── prescription-service/
│   ├── order-service/
│   └── delivery-service/
│
├── shared/                         # Shared utilities
│   ├── database.js
│   └── logger.js
│
├── frontend/                       # React Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── db_schema.sql                   # Database initialization
├── docker-compose.yml              # Container orchestration
├── ARCHITECTURE.md                 # System design
└── README.md
```

---

## 🔐 Environment Configuration

### Backend Services (Create .env in each service root)

```bash
# Template for each service:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drug_delivery_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=20

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

NODE_ENV=development
LOG_LEVEL=debug
LOG_FILE_PATH=../../logs
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENV=development
REACT_APP_TITLE=Drug Delivery Platform
```

---

## 🧪 Testing the System

### 1. User Registration & Login

```bash
# Get the health check
curl http://localhost:4000/health

# Register a new user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

### 2. Browse Medicines

```bash
# Get all medicines
curl http://localhost:4000/medicines

# Search medicines
curl "http://localhost:4000/medicines/search?q=Paracetamol&min_price=50&max_price=200"
```

### 3. Place Order

```bash
# With JWT token from login
TOKEN="your_access_token_here"

curl -X POST http://localhost:4000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_items": [
      {"medicine_id": 1, "quantity": 2, "unit_price": 150.00}
    ],
    "delivery_address_id": 1,
    "idempotency_key": "order-'$(date +%s)'"
  }'
```

### 4. Track Delivery

```bash
# Get delivery status
curl "http://localhost:4000/deliveries/order/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Database Schema

10 Tables with relationships and constraints:

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | User accounts | App users |
| `user_addresses` | Shipping addresses | Delivery locations |
| `medicines` | Product catalog | Available medicines |
| `prescriptions` | Prescription files | User uploads |
| `orders` | Order records | Purchase history |
| `order_items` | Order line items | Items per order |
| `deliveries` | Delivery tracking | Shipping status |
| `payments` | Payment records | Transaction history |
| `stock_reservations` | Concurrent stock | Booking system |
| `audit_logs` | Compliance logs | Admin audit trail |

**View Schema:**
```bash
psql -U postgres -d drug_delivery_db -c "\dt"
```

---

## 🔄 API Endpoints

### Authentication (5001)
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Revoke token

### Users (5002)
- `GET /users/profile` - Get profile
- `PUT /users/profile` - Update profile
- `GET|POST|PUT|DELETE /users/addresses` - Address CRUD

### Medicines (5003)
- `GET /medicines` - List medicines
- `GET /medicines/search` - Search with filters
- `GET|POST|PUT|DELETE /medicines/:id` - CRUD

### Prescriptions (5004)
- `POST /prescriptions/upload` - Upload file
- `GET /prescriptions` - User's prescriptions
- `PUT /prescriptions/:id/approve` - Approve (pharmacist)
- `PUT /prescriptions/:id/reject` - Reject (pharmacist)

### Orders (5005)
- `POST|GET /orders` - Create/list orders
- `GET /orders/:id` - Order details
- `PUT /orders/:id/pay` - Payment
- `PUT /orders/:id/cancel` - Cancellation

### Deliveries (5006)
- `GET /deliveries/order/:id` - Track delivery
- `PUT /deliveries/:id/status` - Update status (agent)
- `GET /deliveries/admin/all` - Admin view

---

## 🛠 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check database exists
psql -l

# Verify credentials in .env files
```

### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Service Won't Start
```bash
# Check port is not in use (Windows)
netstat -ano | findstr :5001

# Kill process using port
taskkill /PID <PID> /F

# Check Logs
cat logs/error.log
```

### Frontend Can't Connect to API
```bash
# Verify API Gateway is running
curl http://localhost:4000/health

# Check CORS is enabled in api-gateway
# Check JWT token in localStorage (DevTools > Application)
```

### Medicine Not Showing in Frontend
```bash
# Check medicines exist in DB
psql -d drug_delivery_db -c "SELECT COUNT(*) FROM medicines;"

# If 0 rows, insert test data
# See db_schema.sql for sample data
```

---

## 📈 Performance Tips

### Database Optimization
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'orders';

-- Create missing indexes if needed
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Redis Cache Effective with:
- Medicines list (1 hour TTL)
- Single medicine (30 minutes TTL)
- Search results (20 minutes TTL)

### Monitor Logs
```bash
# Watch real-time logs
tail -f logs/info.log
tail -f logs/error.log

# Clear old logs
rm logs/*.log
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Stop services
docker-compose down
```

### Kubernetes (Production)
```bash
# Create namespace
kubectl create namespace drug-delivery

# Deploy services
kubectl apply -f k8s/

# Check pods
kubectl get pods -n drug-delivery
```

### Environment-Specific .env

```bash
# Development
REACT_APP_API_URL=http://localhost:4000

# Staging
REACT_APP_API_URL=https://staging-api.example.com

# Production
REACT_APP_API_URL=https://api.example.com
```

---

## 📚 Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design & patterns
- [API_GATEWAY_GUIDE.md](api-gateway/API_GATEWAY_GUIDE.md) - Gateway documentation
- [AUTH_SERVICE_GUIDE.md](services/auth-service/AUTH_SERVICE_GUIDE.md) - Authentication details
- [MEDICINE_SERVICE_GUIDE.md](services/medicine-service/MEDICINE_SERVICE_GUIDE.md) - Products & caching
- [ORDER_SERVICE_GUIDE.md](services/order-service/ORDER_SERVICE_GUIDE.md) - Orders & transactions
- [PRESCRIPTION_SERVICE_GUIDE.md](services/prescription-service/PRESCRIPTION_SERVICE_GUIDE.md) - Prescriptions
- [DELIVERY_SERVICE_GUIDE.md](services/delivery-service/DELIVERY_SERVICE_GUIDE.md) - Logistics
- [frontend/README.md](frontend/README.md) - Frontend setup & components

---

## 📊 System Statistics

| Metric | Value |
|--------|-------|
| **Total Microservices** | 6 |
| **Total API Endpoints** | 40+ |
| **Database Tables** | 10 |
| **Database Indexes** | 15+ |
| **React Components** | 12+ |
| **Total Lines of Code** | 5000+ |
| **Documentation Pages** | 8+ |
| **Total Files** | 70+ |

---

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Microservices architecture patterns
- ✅ ACID transactions in distributed systems
- ✅ JWT authentication & authorization
- ✅ Database indexing & query optimization
- ✅ REST API design principles
- ✅ React hooks & context API
- ✅ Rate limiting & circuit breakers
- ✅ Docker containerization
- ✅ Authentication & security best practices
- ✅ Production-grade code organization

---

## 🔗 Port Reference

| Service | Port | Status |
|---------|------|--------|
| Frontend (React) | 3000 | Development |
| API Gateway | 4000 | Production |
| Auth Service | 5001 | Microservice |
| User Service | 5002 | Microservice |
| Medicine Service | 5003 | Microservice |
| Prescription Service | 5004 | Microservice |
| Order Service | 5005 | Microservice |
| Delivery Service | 5006 | Microservice |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

---

## ✅ Verification Checklist

- [ ] PostgreSQL running and database created
- [ ] Redis running
- [ ] All services can connect to database (check logs)
- [ ] API Gateway routing to services
- [ ] Frontend can login and register
- [ ] Can browse medicines
- [ ] Can add to cart and checkout
- [ ] Orders are created successfully
- [ ] Delivery tracking shows status
- [ ] API responds to CORS requests
- [ ] JWT tokens are valid
- [ ] Cache is working (Redis)

---

## 🆘 Support & Help

### Common Issues

1. **"Cannot find module"** → Run `npm install` in that service
2. **"Connection refused"** → Start PostgreSQL and Redis
3. **"Port already in use"** → Change port in .env or kill process
4. **"CORS error"** → Verify API_URL in frontend .env
5. **"Invalid token"** → Login again or check JWT_SECRET matches

### Getting Help

1. Check relevant guide (see Documentation Index)
2. Review logs in `logs/` folder
3. Test API endpoint directly with curl
4. Check Docker/service status
5. Verify environment variables

---

## 📝 License

This is a demonstration platform for educational purposes. All rights reserved.

---

## 🎉 You're All Set!

Your complete drug delivery platform is ready! 

```
✅ Backend: 6 Microservices
✅ Frontend: React SPA
✅ Database: PostgreSQL
✅ Cache: Redis
✅ Documentation: Comprehensive
✅ Ready for Production!
```

**Next Steps:**
1. Run the system locally
2. Explore the code
3. Add more features
4. Deploy to cloud!

Happy coding! 🚀
