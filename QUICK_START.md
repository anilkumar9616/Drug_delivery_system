# 🚀 Quick Start Guide

Get the Drug Delivery Platform running locally in 5 minutes.

---

## ⚡ TL;DR (Fast Track)

```bash
# 1. Prerequisites installed?
node --version  # Should be >= 16
postgres --version
redis-server --version

# 2. Clone & navigate
git clone <repo-url>
cd drug-delivery

# 3. Setup
npm install    # Install all dependencies
npm run setup  # (or run setup.bat on Windows)

# 4. Database
createdb drug_delivery_db
psql -U postgres drug_delivery_db < docs/DATABASE_SCHEMA.sql

# 5. Start services
docker-compose up -d  # Or start each manually in separate terminals

# 6. Test
curl http://localhost:4000/health
```

---

## 📖 Detailed Setup (Step-by-Step)

### Step 1: Install Prerequisites

#### Windows
```bash
# Using Chocolatey:
choco install nodejs postgresql redis nvm

# Or download manually:
# - Node.js: https://nodejs.org/
# - PostgreSQL: https://www.postgresql.org/download/
# - Redis: https://github.com/microsoftarchive/redis/releases
# - Docker: https://www.docker.com/products/docker-desktop/
```

#### macOS (using Homebrew)
```bash
brew install node postgresql redis docker
brew services start postgresql
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install nodejs npm postgresql postgresql-contrib redis-server

sudo systemctl start postgresql
sudo systemctl start redis-server
```

### Step 2: Verify Installation

```bash
# Node.js and npm
node --version
npm --version

# PostgreSQL
psql --version

# Redis
redis-cli --version

# (Optional) Docker
docker --version
docker-compose --version
```

### Step 3: Clone Repository

```bash
git clone https://github.com/yourorg/drug-delivery.git
cd drug-delivery
```

### Step 4: Install Dependencies

**Option A: Automatic (Run setup script)**
```bash
# Windows
./setup.bat

# macOS/Linux
./setup.sh
```

**Option B: Manual Installation**
```bash
# API Gateway
cd api-gateway
npm install
cd ..

# Auth Service
cd services/auth-service
npm install
cd ../..

# (Continue for other services)
```

### Step 5: Configure Environment

Copy `.env.example` files to `.env` and update as needed:

```bash
# API Gateway
cp api-gateway/.env.example api-gateway/.env

# Auth Service
cp services/auth-service/.env.example services/auth-service/.env

# Update database credentials in .env files:
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
```

### Step 6: Create Database

**Using psql:**
```bash
# Create database
createdb drug_delivery_db

# Import schema
psql -U postgres drug_delivery_db < docs/DATABASE_SCHEMA.sql

# Verify
psql -U postgres drug_delivery_db -c "\dt"
```

**Using GUI (pgAdmin):**
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `drug_delivery_db`
4. Run SQL script: `docs/DATABASE_SCHEMA.sql`

### Step 7: Start Services

**Option A: Docker Compose (Easiest)**
```bash
docker-compose up -d

# View logs
docker-compose logs -f api-gateway

# Stop
docker-compose down
```

**Option B: Local Node.js (For Development)**

Open multiple terminal windows:

```bash
# Terminal 1: API Gateway
cd api-gateway
npm run dev

# Terminal 2: Auth Service
cd services/auth-service
npm run dev

# Terminal 3: Medicine Service
cd services/medicine-service
npm run dev

# (Continue for other services)
```

### Step 8: Verify System is Running

```bash
# Check API Gateway health
curl http://localhost:4000/health

# Expected response:
# {"success":true,"message":"API Gateway is running","timestamp":"..."}

# Check Auth Service
curl http://localhost:5001/health

# Check database connection
psql -U postgres drug_delivery_db -c "SELECT COUNT(*) FROM users;"
```

---

## 🧪 Testing the System

### 1. Register a User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'

# Response:
# {"success":true,"data":{"id":1,"email":"test@example.com",...}}
```

### 2. Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Response includes accessToken and refreshToken
# Save accessToken for authenticated requests
```

### 3. Get Medicines (Protected)

```bash
curl -X GET http://localhost:4000/api/medicines \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### 4. View Logs

```bash
# All services
tail -f api-gateway/logs/access.log

# Errors
tail -f api-gateway/logs/error.log

# Docker logs
docker-compose logs -f api-gateway
```

---

## 🔧 Common Issues & Solutions

### Issue: PostgreSQL Connection Failed

```
Error: FATAL: Ident authentication failed for user "postgres"
```

**Solution:**
```bash
# Edit /etc/postgresql/14/main/pg_hba.conf
# Change "peer" to "md5" for local connections

# Or delete connections:
psql -U postgres

# In psql console:
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'drug_delivery_db';
DROP DATABASE drug_delivery_db;
```

### Issue: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**
```bash
# Find process using port
lsof -i :4000            # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>            # macOS/Linux
taskkill /PID <PID> /F   # Windows

# Or use different port:
GATEWAY_PORT=4001 npm run dev
```

### Issue: Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
```bash
# Start Redis
redis-server              # macOS/Linux
redis-server.exe          # Windows

# Or with Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### Issue: npm install Fails

```
Error: gyp ERR! build error
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Rebuild
npm install --force

# Or use npm ci (cleaner install)
npm ci
```

---

## 🗂️ Project File Structure (What You Need to Know)

```
drug-delivery/
├── api-gateway/              ← Central entry point (Port 4000)
│   ├── src/
│   │   ├── middleware/       ← Auth, rate limiting, logging
│   │   ├── routes/          ← All API endpoints
│   │   └── index.js         ← App entry
│   └── package.json
│
├── services/                 ← Independent microservices
│   ├── auth-service/        (Port 5001) - JWT, login, register
│   ├── user-service/        (Port 5002) - User profile
│   ├── medicine-service/    (Port 5003) - Products & stock
│   ├── prescription-service/(Port 5004) - Prescription upload
│   ├── order-service/       (Port 5005) - Order management
│   └── delivery-service/    (Port 5006) - Delivery tracking
│
├── shared/
│   └── database.js          ← PostgreSQL connection pool
│
├── docs/
│   ├── ARCHITECTURE.md      ← System design (READ THIS!)
│   ├── DATABASE_SCHEMA.sql  ← Database structure
│   └── API_DOCUMENTATION.md ← API endpoints
│
├── docker-compose.yml       ← Local dev containers
├── README.md               ← Main documentation
└── setup.bat/setup.sh      ← Installation script
```

---

## 📝 Next Steps

### After Setup:

1. **Read Architecture**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
   - Understand microservices design
   - Learn API Gateway pattern
   - See request flow diagrams

2. **Explore Database**: [docs/DATABASE_SCHEMA.sql](../docs/DATABASE_SCHEMA.sql)
   - Table structures
   - Relationships & constraints
   - Indexing strategy

3. **Test APIs**: Use Postman or curl
   - Import API collection (if available)
   - Test each endpoint
   - Understand response formats

4. **Start Developing**:
   - Open `api-gateway/src/routes/index.js` to see all endpoints
   - Open `services/auth-service/src/index.js` to understand service structure
   - Follow the pattern for adding new features

5. **Run Tests**:
   ```bash
   npm test  # (if tests are available)
   ```

---

## 🎯 Development Workflow

### Making Changes:

1. **Edit code** in `src/` directories
2. **Services auto-reload** (nodemon watches files)
3. **Check logs** for errors
4. **Test with curl** or Postman

### Adding New Endpoint:

1. Create route in `services/your-service/src/routes/index.js`
2. Create controller in `src/controllers/`
3. Create repository in `src/repositories/`
4. Add middleware if needed in `src/middleware/`
5. Restart service (or use nodemon)
6. Test with API call

### Database Changes:

1. Edit `.sql` file
2. Run: `psql -U postgres drug_delivery_db < update.sql`
3. Verify: `psql -U postgres drug_delivery_db -c "\dt"`

---

## 📞 Need Help?

- 📖 Check [README.md](../README.md) for full documentation
- 🏗️ Review [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for system design
- 🐛 Check `logs/` directory for error messages
- 💬 Create GitHub issue with error details

---

## ✅ Checklist Before You Start Coding

- [ ] Node.js installed (v16+)
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Database created (`drug_delivery_db`)
- [ ] Schema imported (DATABASE_SCHEMA.sql)
- [ ] Dependencies installed (`npm install` in each service)
- [ ] .env files created and configured
- [ ] Services starting without errors
- [ ] Health endpoints responding (curl localhost:4000/health)
- [ ] You can make API calls (curl with access token)

---

**Happy Coding! 🚀**
