# Drug Delivery Platform - Quick Reference Card

## 🚀 Start Everything in 30 Seconds

```bash
cd drug-delivery
docker-compose up -d
cd frontend && npm install && npm start
# Open http://localhost:3000
```

---

## 👤 Demo Accounts

### Pharmacist / Admin
- **Email**: pharmacist@example.com
- **Password**: SecurePass123

### Regular User
- **Email**: user@example.com
- **Password**: Password123

### Or Register New Account
- Go to http://localhost:3000/register
- Create account with valid email + password (8+ chars, uppercase, lowercase, number)

---

## 📍 Service Locations

| What | URL | Purpose |
|------|-----|---------|
| **Frontend** | http://localhost:3000 | React app |
| **API** | http://localhost:4000 | Gateway |
| **Auth API** | http://localhost:5001 | User auth |
| **Medicine API** | http://localhost:5003 | Products |
| **Database** | localhost:5432 | PostgreSQL |
| **Cache** | localhost:6379 | Redis |

---

## 🔐 Login Flow

1. Visit http://localhost:3000
2. Click "Login"
3. Enter email & password
4. JWT token stored in localStorage
5. Navbar shows "Browse Medicines"
6. Start shopping!

---

## 🛍️ Shopping Flow

1. **Browse** → Click "Browse Medicines"
2. **Search** → Use search bar (e.g., "Paracetamol")
3. **Filter** → By price range or prescription requirement
4. **Add** → "Add to Cart" button
5. **Review** → Cart summary on right side
6. **Checkout** → Click "Checkout" in cart summary
7. **Address** → Select delivery address (or add new)
8. **Order** → Review subtotal/tax/total, click "Place Order"
9. **Confirm** → Order created, redirected to /orders
10. **Track** → Go to "Track Delivery" to see status

---

## 📦 Track Order

1. Click "Track Delivery" in navbar
2. See visual timeline for each order:
   - ⏳ Pending (waiting for assignment)
   - 👤 Assigned (agent assigned)
   - 🚚 In Transit (on the way)
   - ✅ Delivered (arrived) or ❌ Failed
3. See address, estimated date, notes

---

## 🔍 Check API Endpoints

```bash
# Health check
curl http://localhost:4000/health

# List medicines
curl http://localhost:4000/medicines

# Search
curl "http://localhost:4000/medicines/search?q=Aspirin"

# Login and get token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# Use token to get orders
curl http://localhost:4000/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 If Something Doesn't Work

### Frontend won't load
```bash
# Clear cache and restart
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't login
- Check email is exact (case-sensitive in some systems)
- Password must have: 8+ chars, uppercase, lowercase, number
- Check API returns token: `curl http://localhost:4000/auth/login`

### API not responding
```bash
# Check all services running
docker-compose ps
# or check port 4000
curl http://localhost:4000/health
```

### Database error
```bash
# Check PostgreSQL running
psql -U postgres -d drug_delivery_db -c "SELECT 1"
# Check tables exist
psql -d drug_delivery_db -c "\dt"
```

### Can't see medicines
```bash
# Check database has medicines
psql -d drug_delivery_db -c "SELECT COUNT(*) FROM medicines;"
# If 0, see db_schema.sql for sample data
```

---

## 🚨 Emergency Commands

```bash
# Stop everything
docker-compose down

# Restart everything
docker-compose restart

# View logs
docker-compose logs -f api-gateway

# Clean restart
docker-compose down -v
docker-compose up -d

# Kill stuck processes (Windows)
taskkill /PID <PID> /F

# Kill by port (Windows)
netstat -ano | findstr :4000
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Start all services |
| `db_schema.sql` | Database structure |
| `.env` | Configuration |
| `frontend/src/App.js` | React routing |
| `api-gateway/src/index.js` | Gateway server |
| `services/*/index.js` | Service servers |

---

## 🎯 Core User Flows

### Register → Login → Browse → Order → Track

```
Frontend          API Gateway       Services       Database
  ↓                   ↓                 ↓             ↓
Register ────→ /auth/register ────→ AuthService ──→ users table
  ├─ JWT stored in localStorage
  └─ Auto login
  
Login ────────→ /auth/login ────────→ AuthService ──→ Verify
  ├─ JWT returned
  └─ Axios adds to header

Browse ────────→ /medicines ───────→ MedicineService → medicines table
  ├─ Cached in Redis (1 hr)
  └─ Search queries filtered

Add to Cart ───→ localStorage (no API call)
  └─ Persists across refresh

Checkout ──────→ /orders ──────────→ OrderService ──→ orders table
  ├─ Creates order
  ├─ Calculates tax (18%)
  └─ Triggers delivery creation

Order Created ──→ /orders/:id ──────→ OrderService ──→ Reads from DB
  ├─ Returns order details
  └─ Delivery auto-created

Track ─────────→ /deliveries/order/:id → DeliveryService → deliveries table
  ├─ Status updates
  └─ Agent assignment
```

---

## 💾 Data Persistence

| Data | Store | Persistence |
|------|-------|-------------|
| JWT Token | localStorage | Across page refresh |
| User Cart | localStorage | Across browser session |
| Orders | PostgreSQL | Permanent |
| User Info | PostgreSQL | Permanent |
| Medicines | PostgreSQL + Redis | Cached 1 hour |
| Delivery Status | PostgreSQL | Real-time |

---

## 🔒 Security Features

✅ Passwords hashed with bcrypt (10 rounds)
✅ JWT authentication (15 min access token)
✅ Token refresh on 401 response
✅ Protected routes (require login)
✅ Parameterized DB queries (SQL injection safe)
✅ CORS enabled only for frontend
✅ RBAC: User, Pharmacist, Admin, Agent roles
✅ Rate limiting: 100 global, 5 auth, 200 per-user per-minute

---

## 📊 Test Data in Database

Default medicines pre-loaded:
- Paracetamol 500mg → Rs. 50
- Ibuprofen 200mg → Rs. 100
- Aspirin 100mg → Rs. 75
- Amoxicillin 500mg → Rs. 150 (requires Rx)
- Cough Syrup 100ml → Rs. 120
- Vitamin C 500mg → Rs. 80

---

## 🎮 Play Around Features

### In Frontend:
- [ ] Register a new account
- [ ] Login with different users
- [ ] Search medicines by name
- [ ] Filter by price (50-200)
- [ ] Filter by prescription requirement
- [ ] Add multiple medicines to cart
- [ ] Update quantities in cart
- [ ] Remove items from cart
- [ ] Go through checkout
- [ ] View created order details
- [ ] Track delivery status
- [ ] See delivery timeline progress
- [ ] Logout and login again (see persistent auth)

### In API (with curl/Postman):
- [ ] Register user via POST /auth/register
- [ ] Login via POST /auth/login
- [ ] List medicines via GET /medicines
- [ ] Search via GET /medicines/search?q=...
- [ ] Get specific medicine via GET /medicines/1
- [ ] Create order via POST /orders
- [ ] Get orders via GET /orders
- [ ] Release delivery via PUT /deliveries/:id/status

---

## 📈 Monitoring

### Check Database
```bash
psql -d drug_delivery_db -c "SELECT * FROM users;"
psql -d drug_delivery_db -c "SELECT * FROM orders LIMIT 5;"
```

### Check Redis
```bash
redis-cli
> KEYS *
> GET medicine_list
> DBSIZE
```

### Check Logs
```bash
docker-compose logs api-gateway
docker-compose logs service.auth
tail -f logs/error.log
```

---

## 🆘 Useful Shortcuts

```bash
# Open database
psql -U postgres -d drug_delivery_db

# View all tables
\dt

# View users
SELECT * FROM users;

# Clear cache
redis-cli FLUSHALL

# Stop services
docker-compose down

# Start services
docker-compose up -d

# View frontend code
code frontend/

# View backend code
code api-gateway/
code services/
```

---

## 📞 Common API Responses

### Success (200)
```json
{
  "success": true,
  "data": { /* response body */ }
}
```

### Error (400/401/500)
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Login Response (200)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "email": "user@example.com", "role": "user" }
  }
}
```

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
**All Services**: ✅ Running
**Database**: ✅ Initialized
**Frontend**: ✅ Connected

---

💡 **Pro Tip**: Check individual service guides in their directories for detailed API documentation!

