# 🚀 Backend Services Startup Guide

## Database Setup (PostgreSQL)

### Step 1: Create Database
```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE drug_delivery_db;

# Verify creation
\l

# Exit
\q
```

### Step 2: Import Schema
```bash
# Navigate to project root
cd c:\Users\anilk\OneDrive\Desktop\FULLSTACK\drug-delivery

# Import the database schema
psql -U postgres -d drug_delivery_db -f db_schema.sql

# Verify tables were created
psql -U postgres -d drug_delivery_db -c "\dt"
```

**Expected output:** Should show 10 tables (users, medicines, orders, etc.)

### Step 3: Verify Database Connection
```bash
# Test connection with your password
psql -U postgres -d drug_delivery_db -c "SELECT 1"

# Should return: 1 (meaning connection successful)
```

---

## Environment Configuration

### Your Credentials
- **DB User**: postgres
- **DB Password**: admin
- **DB Host**: localhost
- **DB Port**: 5432
- **DB Name**: drug_delivery_db

### Shared .env
A shared `.env` file is already configured at:
```
shared/.env
```

Contents:
```dotenv
DB_USER=postgres
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drug_delivery_db
DB_POOL_SIZE=20
LOG_QUERIES=false
```

### Service .env Files
Each service has its own `.env` file. They should already be set up, but verify they match your credentials:

**Files to check:**
- `api-gateway/.env`
- `services/auth-service/.env`
- `services/user-service/.env`
- `services/medicine-service/.env`
- `services/prescription-service/.env`
- `services/order-service/.env`
- `services/delivery-service/.env`

---

## Redis Setup

### Start Redis Server
```bash
# On Windows (if using Windows Subsystem for Linux or installed binary)
redis-server

# If redis-server command not found, check if Redis is installed
which redis-server
```

**Expected:** Redis should output something like:
```
Ready to accept connections tcp
```

---

## Backend Services Startup

You have **3 options** to run the backend services:

### ⭐ OPTION 1: Docker Compose (EASIEST - Recommended)

```bash
# Navigate to project root
cd c:\Users\anilk\OneDrive\Desktop\FULLSTACK\drug-delivery

# Start all services with one command
docker-compose up -d

# Verify all services are running
docker-compose ps

# Expected: All 7 services should show "Up"
```

**Services started:**
- API Gateway (4000)
- Auth Service (5001)
- User Service (5002)
- Medicine Service (5003)
- Prescription Service (5004)
- Order Service (5005)
- Delivery Service (5006)
- PostgreSQL (5432)
- Redis (6379)

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f service.auth
```

**Stop all services:**
```bash
docker-compose down
```

---

### OPTION 2: Manual Startup (7 Terminals)

Open **7 separate terminal windows/tabs** and run each command:

#### Terminal 1: API Gateway
```bash
cd api-gateway
npm install  # Only first time
npm start
# Expected: ✓ API Gateway listening on port 4000
```

#### Terminal 2: Auth Service
```bash
cd services/auth-service
npm install  # Only first time
npm start
# Expected: ✓ Auth Service running on port 5001
```

#### Terminal 3: User Service
```bash
cd services/user-service
npm install  # Only first time
npm start
# Expected: ✓ User Service running on port 5002
```

#### Terminal 4: Medicine Service
```bash
cd services/medicine-service
npm install  # Only first time
npm start
# Expected: ✓ Medicine Service running on port 5003
```

#### Terminal 5: Prescription Service
```bash
cd services/prescription-service
npm install  # Only first time
npm start
# Expected: ✓ Prescription Service running on port 5004
```

#### Terminal 6: Order Service
```bash
cd services/order-service
npm install  # Only first time
npm start
# Expected: ✓ Order Service running on port 5005
```

#### Terminal 7: Delivery Service
```bash
cd services/delivery-service
npm install  # Only first time
npm start
# Expected: ✓ Delivery Service running on port 5006
```

**All services should display "running on port XXXX" messages.**

---

### OPTION 3: Script-Based Startup (Batch File - Windows)

Create a file named `start-all-services.bat`:

```batch
@echo off
TITLE Drug Delivery Platform - All Services

REM Open each service in a new window
start "API Gateway" cmd /k "cd api-gateway && npm start"
REM Give it a moment to start
timeout /t 2

start "Auth Service" cmd /k "cd services\auth-service && npm start"
timeout /t 2

start "User Service" cmd /k "cd services\user-service && npm start"
timeout /t 2

start "Medicine Service" cmd /k "cd services\medicine-service && npm start"
timeout /t 2

start "Prescription Service" cmd /k "cd services\prescription-service && npm start"
timeout /t 2

start "Order Service" cmd /k "cd services\order-service && npm start"
timeout /t 2

start "Delivery Service" cmd /k "cd services\delivery-service && npm start"

echo All services started in separate windows!
pause
```

Run it:
```bash
start-all-services.bat
```

---

## Verification Checklist

After starting all services, verify everything is working:

### ✅ Check API Gateway
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok"}
```

### ✅ Check Auth Service (via Gateway)
```bash
# List all medicines (no auth required)
curl http://localhost:4000/medicines

# Should return array of medicines
```

### ✅ Check Database Connection
```bash
# Query database directly
psql -U postgres -d drug_delivery_db -c "SELECT COUNT(*) FROM medicines;"

# Should return count > 0
```

### ✅ Check Redis Connection
```bash
redis-cli ping
# Expected: PONG
```

### ✅ Test Complete Flow
```bash
# 1. Register user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

# 2. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 3. Get token from response and use it:
TOKEN="your_token_here"

# 4. Get user profile (requires auth)
curl http://localhost:4000/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Service Port Reference

| Service | Port | Health Check |
|---------|------|---|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 4000 | http://localhost:4000/health |
| Auth Service | 5001 | Via Gateway |
| User Service | 5002 | Via Gateway |
| Medicine Service | 5003 | Via Gateway |
| Prescription Service | 5004 | Via Gateway |
| Order Service | 5005 | Via Gateway |
| Delivery Service | 5006 | Via Gateway |
| PostgreSQL | 5432 | psql -U postgres -d drug_delivery_db -c "SELECT 1" |
| Redis | 6379 | redis-cli ping |

---

## Common Issues & Solutions

### ❌ "Database connection refused"
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -U postgres -d drug_delivery_db -c "SELECT 1"

# Check .env files have correct password (should be "admin")
```

### ❌ "Port 4000 already in use"
```bash
# Find process using port 4000 (Windows)
netstat -ano | findstr :4000

# Kill the process
taskkill /PID <PID> /F

# Or change port in api-gateway/.env
PORT=4001
```

### ❌ "Redis connection refused"
```bash
# Check Redis is running
redis-cli ping

# Start Redis if it's not running
redis-server

# Or check if it's listening on different port
redis-cli -p 6380 ping
```

### ❌ "Module not found" errors
```bash
# Reinstall dependencies
cd api-gateway
rm -r node_modules package-lock.json
npm install

# Do the same for each service
cd ../services/auth-service
rm -r node_modules package-lock.json
npm install
# ... repeat for other services
```

### ❌ Service won't start - "EADDRINUSE"
```bash
# This means the port is already in use
# Option 1: Kill the existing process
lsof -i :5001  # Find process on port 5001
kill -9 <PID>

# Option 2: Change port in service .env
PORT=5011
```

### ❌ Database migration error
```bash
# Reimport the schema
psql -U postgres -d drug_delivery_db -f db_schema.sql

# If that fails, drop and recreate
psql -U postgres -c "DROP DATABASE drug_delivery_db;"
psql -U postgres -c "CREATE DATABASE drug_delivery_db;"
psql -U postgres -d drug_delivery_db -f db_schema.sql
```

---

## Performance Monitoring

### View Service Logs
```bash
# Docker Compose
docker-compose logs -f api-gateway

# Manual startup - logs appear in terminal
tail -f logs/access.log
tail -f logs/error.log
```

### Monitor Database
```bash
# Check active connections
psql -d drug_delivery_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check table sizes
psql -d drug_delivery_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Monitor Redis
```bash
redis-cli
> INFO stats
> DBSIZE
> KEYS *
> FLUSHALL  # Clear all cache (use with caution!)
```

---

## Next Steps

Once all services are running:

1. **Start Frontend** (if not already running)
   ```bash
   cd frontend
   npm install  # Only first time
   npm start
   # Opens http://localhost:3000
   ```

2. **Test the System**
   - Navigate to http://localhost:3000
   - Register a new account
   - Browse medicines
   - Place an order
   - Track delivery

3. **API Testing**
   - Use curl (terminal)
   - Or use Postman/Insomnia for GUI
   - See individual service guides for endpoint documentation

4. **Monitor & Debug**
   - Check logs for any errors
   - Verify database has data
   - Check Redis cache is working
   - Monitor service response times

---

## Shutdown

### Docker Compose
```bash
docker-compose down
```

### Manual Startup
- Close each terminal window, or
- Press `Ctrl+C` in each terminal

---

## Summary

**Quickest Start (Recommended):**
```bash
cd c:\Users\anilk\OneDrive\Desktop\FULLSTACK\drug-delivery
docker-compose up -d
cd frontend && npm start
```

**All services will be ready in 30-60 seconds!**

---

**Need Help?**
- Check service .env files match your credentials
- View logs in docker-compose logs or terminal output
- Verify PostgreSQL and Redis are running
- Restart services if connection issues persist

Good luck! 🚀
