# Delivery Service Guide

## Overview

The Delivery Service manages the logistics and fulfillment lifecycle for the Drug Delivery E-commerce Platform. It handles delivery creation, agent assignment, status tracking, and delivery metrics. This is the final microservice that completes the backend infrastructure.

**Service Port:** 5006  
**Database:** PostgreSQL  
**Cache:** Redis  
**Pattern:** Controller → Service → Repository → Database

---

## Key Features

### 1. **Delivery Management**
- Create delivery records when orders are shipped
- Track delivery status through multiple stages
- Maintain delivery address and estimated delivery dates
- Support delivery location tracking and contact attempts

### 2. **Agent Assignment**
- Assign delivery agents to pending deliveries
- Auto-transition status to "assigned" on agent assignment
- Query deliveries by agent with filtering
- Validate delivery ownership (agent can only update their own)

### 3. **Status Tracking**
- Multi-stage delivery lifecycle: pending → assigned → in_transit → delivered
- Support failed delivery handling with reassignment
- Handle returned/cancellation cases
- Automatic timestamp tracking (delivered_at)

### 4. **Performance Metrics**
- Agent-level performance tracking (completion rate, delivery count)
- Platform-wide delivery statistics
- SLA monitoring (estimated vs actual delivery dates)
- Delayed delivery alerts

---

## API Endpoints

### User/Order Endpoints

#### Create Delivery (Internal - Order Service)
```http
POST /deliveries
Content-Type: application/json

Body:
{
  "order_id": 5,
  "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
  "estimated_delivery_date": "2026-04-06T18:00:00Z"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 5,
    "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
    "status": "pending",
    "assigned_agent_id": null,
    "estimated_delivery_date": "2026-04-06T18:00:00Z",
    "created_at": "2026-04-04T10:30:00Z",
    "updated_at": "2026-04-04T10:30:00Z"
  }
}
```

#### Get Delivery Status
```http
GET /deliveries/order/{orderId}
Authorization: Bearer {jwt_token}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 5,
    "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
    "status": "in_transit",
    "assigned_agent_id": 12,
    "notes": "Out for delivery",
    "location": "Near customer location",
    "delivered_at": null,
    "estimated_delivery_date": "2026-04-06T18:00:00Z",
    "created_at": "2026-04-04T10:30:00Z",
    "updated_at": "2026-04-04T14:30:00Z"
  }
}
```

#### Get Delivery Details
```http
GET /deliveries/{id}
Authorization: Bearer {jwt_token}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 5,
    "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
    "status": "delivered",
    "assigned_agent_id": 12,
    "notes": "Delivered successfully",
    "location": "Customer location",
    "contact_attempted": true,
    "delivered_at": "2026-04-05T17:45:00Z",
    "estimated_delivery_date": "2026-04-06T18:00:00Z",
    "created_at": "2026-04-04T10:30:00Z",
    "updated_at": "2026-04-05T17:45:00Z"
  }
}
```

### Delivery Agent Endpoints

#### Get My Deliveries
```http
GET /deliveries/agent/my-deliveries?status=in_transit&limit=10&offset=0
Authorization: Bearer {jwt_token}
Requires Role: delivery_agent

Query Parameters:
- status: pending | assigned | in_transit | delivered | failed (optional)
- limit: integer (default: 50)
- offset: integer (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "deliveries": [
      {
        "id": 1,
        "order_id": 5,
        "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
        "status": "in_transit",
        "assigned_agent_id": 12,
        "notes": "Out for delivery",
        "location": "Near customer location",
        "estimated_delivery_date": "2026-04-06T18:00:00Z",
        "created_at": "2026-04-04T10:30:00Z"
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### Update Delivery Status
```http
PUT /deliveries/{id}/status
Content-Type: application/json
Authorization: Bearer {jwt_token}

Body:
{
  "status": "delivered",
  "notes": "Package delivered successfully to recipient",
  "location": "Apartment building entrance",
  "contact_attempted": true
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 5,
    "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
    "status": "delivered",
    "assigned_agent_id": 12,
    "notes": "Package delivered successfully to recipient",
    "location": "Apartment building entrance",
    "contact_attempted": true,
    "delivered_at": "2026-04-05T17:45:00Z",
    "estimated_delivery_date": "2026-04-06T18:00:00Z",
    "created_at": "2026-04-04T10:30:00Z",
    "updated_at": "2026-04-05T17:45:00Z"
  }
}

Error Examples:
{
  "success": false,
  "error": "Invalid status transition from delivered to in_transit",
  "code": "INVALID_STATUS"
}
```

### Admin Endpoints

#### Assign Delivery Agent
```http
PUT /deliveries/{id}/assign
Content-Type: application/json
Authorization: Bearer {admin_token}

Body:
{
  "agent_id": 12
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 5,
    "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
    "status": "assigned",
    "assigned_agent_id": 12,
    "estimated_delivery_date": "2026-04-06T18:00:00Z",
    "created_at": "2026-04-04T10:30:00Z",
    "updated_at": "2026-04-04T10:35:00Z"
  }
}
```

#### Get All Deliveries
```http
GET /deliveries/admin/all?status=in_transit&agent_id=12&limit=20&offset=0
Authorization: Bearer {admin_token}
Requires Role: admin

Query Parameters:
- status: pending | assigned | in_transit | delivered | failed (optional)
- agent_id: integer (optional, filter by agent)
- limit: integer (default: 50)
- offset: integer (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "deliveries": [
      {
        "id": 1,
        "order_id": 5,
        "delivery_address": "123 Main St, Apt 4B, Springfield, IL 62701",
        "status": "in_transit",
        "assigned_agent_id": 12,
        "estimated_delivery_date": "2026-04-06T18:00:00Z",
        "created_at": "2026-04-04T10:30:00Z"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Delivery Statistics
```http
GET /deliveries/admin/stats
Authorization: Bearer {admin_token}
Requires Role: admin

Response (200):
{
  "success": true,
  "data": {
    "total_deliveries": 150,
    "pending": 5,
    "assigned": 12,
    "in_transit": 8,
    "delivered": 120,
    "failed": 3,
    "returned": 2,
    "active_agents": 7,
    "avg_delivery_hours": 42.5
  }
}
```

#### Get Agent Performance Metrics
```http
GET /deliveries/admin/agent/{agentId}/metrics
Authorization: Bearer {admin_token}
Requires Role: admin

Response (200):
{
  "success": true,
  "data": {
    "agent_id": 12,
    "total_deliveries": 42,
    "completed_deliveries": 39,
    "failed_deliveries": 2,
    "contact_attempts": 8,
    "completion_rate": 92.86,
    "first_delivery_date": "2026-03-10T08:00:00Z",
    "last_delivery_date": "2026-04-05T17:45:00Z"
  }
}
```

---

## Database Schema

### `deliveries` Table

```sql
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  delivery_address TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled')),
  assigned_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  location VARCHAR(500),
  contact_attempted BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP,
  estimated_delivery_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_agent_id ON deliveries(assigned_agent_id);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX idx_deliveries_estimated_date ON deliveries(estimated_delivery_date);
```

---

## Service Architecture

### Controller Layer (`deliveryController.js`)

Handles HTTP request validation and response formatting. Key methods:
- `createDelivery()` - Create delivery for order (internal)
- `getDeliveryByOrder()` - Retrieve delivery by order ID
- `getDeliveryById()` - Get specific delivery details
- `getAgentDeliveries()` - Retrieve agent's deliveries
- `updateDeliveryStatus()` - Update delivery status with validation
- `assignDeliveryAgent()` - Assign agent to delivery
- `getAllDeliveries()` - Admin view of all deliveries
- `getDeliveryStats()` - Platform statistics
- `getAgentMetrics()` - Agent performance metrics
- `health()` - Service health check

**Validation Rules:**
- Status must be valid and follow transition rules
- Agent can only update own deliveries
- Order must exist for new delivery
- Delivery must exist before status updates

### Service Layer (`deliveryService.js`)

Business logic and orchestration. Key methods:
- `createDelivery()` - Create with validation
- `getDeliveryByOrder()` - Query by order
- `getDeliveryById()` - Retrieve delivery
- `getAgentDeliveries()` - Agent's list with filtering
- `updateDeliveryStatus()` - Status transitions with validation
- `assignDeliveryAgent()` - Agent assignment
- `getAllDeliveries()` - Admin queries
- `getDeliveryStats()` - Aggregate statistics
- `getAgentMetrics()` - Pharmacist performance
- `getDelayedDeliveries()` - SLA violations

**Business Rules:**
- Status transitions are validated:
  - pending → assigned | cancelled
  - assigned → in_transit | failed | cancelled
  - in_transit → delivered | failed
  - delivered → returned
  - failed → assigned | cancelled
- Delivery cannot be created if already exists for order
- Agent assignment auto-transitions pending to assigned
- Delivered_at timestamp set on "delivered" status
- Average delivery time calculated in stats

### Repository Layer (`deliveryRepository.js`)

Database query methods:
- `create()` - Insert new delivery
- `findById()` - Fetch delivery by ID
- `findByOrderId()` - Fetch by order
- `findByAgentId()` - Fetch agent's deliveries with filtering
- `findAll()` - All deliveries with filtering (admin)
- `updateStatus()` - Update with timestamp
- `assignAgent()` - Agent assignment with status update
- `getStats()` - Aggregated statistics
- `getAgentMetrics()` - Agent performance metrics
- `findDelayed()` - SLA violations
- `findUnassigned()` - Pending agent assignment

---

## Integration Points

### Order Service Integration

When Order Status transitions to "shipped":

1. Order Service calls POST /deliveries
2. Delivery created with status "pending"
3. Admin assigns agent and delivery moves to "assigned"
4. Agent updates status as they progress

**Example Flow:**
```
Order Payment Complete
  ↓
Order status: paid → shipped
  ↓
Create Delivery Record
  ↓
Delivery status: pending
  ↓
Admin assigns agent
  ↓
Delivery status: assigned
  ↓
Agent picks up and updates
  ↓
Delivery status: in_transit
  ↓
Customer receives
  ↓
Delivery status: delivered
```

---

## Status Transition Diagram

```
         [pending]
         /        \
    assigned    cancelled
       |
   [assigned]
     /    \
  in_trans cancelled
   |       /
  [in_transit]
  /         \
delivered  failed
          /
[delivered]  [failed] ----\
    |                      |
 returned              assigned
    |                      |
[returned]             (reassign)
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NO_TOKEN` | 401 | Missing authorization token |
| `INVALID_TOKEN` | 401 | Token invalid or expired |
| `UNAUTHORIZED` | 403 | Agent cannot update others' deliveries |
| `DELIVERY_NOT_FOUND` | 404 | Delivery ID doesn't exist |
| `ORDER_NOT_FOUND` | 404 | Order not found |
| `DELIVERY_EXISTS` | 409 | Delivery already exists for order |
| `MISSING_ID` | 400 | Missing delivery ID parameter |
| `MISSING_ORDER_ID` | 400 | Missing order_id field |
| `MISSING_AGENT_ID` | 400 | Missing agent_id field |
| `MISSING_ADDRESS` | 400 | Missing delivery_address field |
| `MISSING_STATUS` | 400 | Missing status field |
| `INVALID_STATUS` | 400 | Invalid status transition |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Environment Variables

```bash
# Service Configuration
DELIVERY_SERVICE_PORT=5006

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drug_delivery_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Security
JWT_SECRET=your_super_secret_key

# Application
NODE_ENV=development
LOG_LEVEL=debug
LOG_FILE_PATH=../../logs

# Delivery Configuration
SLA_HOURS=48
DELAYED_DELIVERY_ALERT_HOURS=24
DELIVERY_ATTEMPT_THRESHOLD=3
```

---

## Performance Considerations

### Database Optimization
- **Indexes:** Queries on `order_id`, `status`, `assigned_agent_id`, `created_at`, `estimated_delivery_date`
- **Pagination:** Limit 50 deliveries per request
- **Denormalization:** Avoid N+1 queries with proper JOINs

### Caching Strategy (Future)
- Cache agent deliveries per agent (10 min TTL)
- Invalidate cache on status update
- Cache statistics for admin dashboard (5 min TTL)

### Monitoring
- Set alerts for deliveries past SLA
- Track agent performance metrics
- Monitor failed vs successful deliveries

---

## Testing Scenarios

### Create Delivery (Order Service Call)
```bash
curl -X POST http://localhost:5006/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 5,
    "delivery_address": "123 Main St, Springfield",
    "estimated_delivery_date": "2026-04-06T18:00:00Z"
  }'
```

### Update Delivery Status (Agent)
```bash
curl -X PUT http://localhost:4000/deliveries/1/status \
  -H "Authorization: Bearer {agent_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "notes": "Delivered successfully",
    "location": "Front door",
    "contact_attempted": true
  }'
```

### Get Delivery Statistics (Admin)
```bash
curl -X GET http://localhost:4000/deliveries/admin/stats \
  -H "Authorization: Bearer {admin_token}"
```

### Get Agent Metrics (Admin)
```bash
curl -X GET http://localhost:4000/deliveries/admin/agent/12/metrics \
  -H "Authorization: Bearer {admin_token}"
```

---

## Deployment Checklist

- [ ] Database migration: Run schema creation script
- [ ] Environment variables configured (.env)
- [ ] JWT_SECRET set securely
- [ ] Redis connection verified
- [ ] API Gateway routes updated with Delivery Service endpoints
- [ ] Service registered in docker-compose.yml
- [ ] Health endpoint responding
- [ ] Can create deliveries from Order Service
- [ ] Agent can update delivery status
- [ ] Admin can view statistics

---

## Troubleshooting

### Delivery Not Found
- Verify delivery ID exists
- Check order exists (delivery should be created when order ships)
- Verify user has access (agent or admin)

### Invalid Status Transition
- Check current delivery status
- Review valid transitions for that status
- Ensure status is in lowercase
- Verify status value is one of: pending, assigned, in_transit, delivered, failed, returned, cancelled

### Agent Assignment Fails
- Verify agent user ID exists
- Check agent has 'delivery_agent' role
- Ensure delivery is in 'pending' status

### Statistics Query Slow
- Check database indexes on deliveries table
- Consider caching statistics with TTL
- Monitor database connection pool

---

## Future Enhancements

1. **Real-time Tracking**
   - GPS coordinates for agent location
   - Live map updates to customer
   - Geofence alerts for arrival

2. **Notifications**
   - SMS/Email when delivery assigned
   - Out for delivery notification
   - Delivery confirmation message

3. **Route Optimization**
   - Assign deliveries based on geographic clustering
   - Optimize agent routes
   - Reduce delivery time/cost

4. **Delivery Proof**
   - Photo evidence of delivery
   - Recipient signature capture
   - OTP verification at delivery

5. **Analytics**
   - Delivery heatmaps
   - Agent utilization baselines
   - Seasonal demand patterns

6. **Failed Delivery Management**
   - Auto-retry scheduling
   - Customer return window options
   - Refund processing on failed delivery

---

## Support & Documentation

For additional help:
- Check logs in `../../logs/`
- Review API Gateway error responses
- Consult ARCHITECTURE.md for service integration patterns
- Review database schema in `db_schema.sql`
- Check Order Service integration points for delivery creation flow
