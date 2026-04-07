# Prescription Service Guide

## Overview

The Prescription Service manages the prescription lifecycle for the Drug Delivery E-commerce Platform. It handles prescription uploads, approval workflows, validation, and expiry tracking. This service integrates with the Order Service to enforce prescription requirements for medicines.

**Service Port:** 5004  
**Database:** PostgreSQL  
**Cache:** Redis  
**Pattern:** Controller → Service → Repository → Database

---

## Key Features

### 1. **Prescription Upload**
- Users can upload prescription files (PDF, JPEG, PNG)
- File size limited to 5MB
- Automatic file storage with timestamp-based naming
- Validation of file format and size

### 2. **Approval Workflow**
- Pending → Approved/Rejected state transitions
- Approval notes/rejection reasons tracked
- Only admin/pharmacist can approve or reject
- Approval date and expiry (1 year from approval) calculated

### 3. **Validation**
- Check if user has valid approved prescriptions
- Required by Order Service for medicines marked `requires_prescription=true`
- Expiry tracking (1 year validity from approval date)
- Prescription renewal warnings (30 days before expiry)

### 4. **Admin Features**
- View pending prescriptions queue
- Approve or reject prescriptions with notes
- View prescription statistics (counts by status, unique users)
- Monitor expiring prescriptions

---

## API Endpoints

### User Endpoints

#### Upload Prescription
```http
POST /prescriptions/upload
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

Body:
- prescription_file: File (PDF, JPEG, PNG, max 5MB)
- medicine_id: Integer (optional, specific medicine for this prescription)

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "file_url": "/uploads/prescription-123456789.pdf",
    "status": "pending",
    "medicine_id": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get User Prescriptions
```http
GET /prescriptions?status=approved&limit=10&offset=0
Authorization: Bearer {jwt_token}

Query Parameters:
- status: "pending" | "approved" | "rejected" (optional)
- limit: integer (default: 50)
- offset: integer (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "user_id": 5,
        "file_url": "/uploads/prescription-123456789.pdf",
        "status": "approved",
        "medicine_id": null,
        "approved_by_id": 2,
        "approval_date": "2024-01-15T10:45:00Z",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:45:00Z"
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

#### Get Prescription Details
```http
GET /prescriptions/:id
Authorization: Bearer {jwt_token}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "file_url": "/uploads/prescription-123456789.pdf",
    "status": "approved",
    "medicine_id": null,
    "approval_notes": "Verified with physician",
    "approved_by_id": 2,
    "approval_date": "2024-01-15T10:45:00Z",
    "expires_at": "2025-01-15T10:45:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:45:00Z"
  }
}
```

### Pharmacist/Admin Endpoints

#### Get Pending Prescriptions
```http
GET /prescriptions/pending/all?limit=20&offset=0
Authorization: Bearer {jwt_token}
Requires Role: pharmacist | admin

Query Parameters:
- limit: integer (default: 50)
- offset: integer (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 5,
        "user_id": 8,
        "file_url": "/uploads/prescription-987654321.png",
        "status": "pending",
        "created_at": "2024-01-20T09:00:00Z",
        "updated_at": "2024-01-20T09:00:00Z"
      }
    ],
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

#### Approve Prescription
```http
PUT /prescriptions/:id/approve
Content-Type: application/json
Authorization: Bearer {jwt_token}
Requires Role: pharmacist | admin

Body:
{
  "notes": "Verified with licensed physician, valid for 12 months"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 5,
    "user_id": 8,
    "file_url": "/uploads/prescription-987654321.png",
    "status": "approved",
    "medicine_id": null,
    "approval_notes": "Verified with licensed physician, valid for 12 months",
    "approved_by_id": 2,
    "approval_date": "2024-01-20T10:15:00Z",
    "expires_at": "2025-01-20T10:15:00Z",
    "created_at": "2024-01-20T09:00:00Z",
    "updated_at": "2024-01-20T10:15:00Z"
  }
}
```

#### Reject Prescription
```http
PUT /prescriptions/:id/reject
Content-Type: application/json
Authorization: Bearer {jwt_token}
Requires Role: pharmacist | admin

Body:
{
  "reason": "Prescription image is unclear, please resubmit"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 5,
    "user_id": 8,
    "file_url": "/uploads/prescription-987654321.png",
    "status": "rejected",
    "approval_notes": "Prescription image is unclear, please resubmit",
    "approved_by_id": 2,
    "approval_date": "2024-01-20T10:15:00Z",
    "created_at": "2024-01-20T09:00:00Z",
    "updated_at": "2024-01-20T10:15:00Z"
  }
}
```

### Internal Endpoints

#### Check Valid Prescriptions
```http
POST /prescriptions/check/valid
Content-Type: application/json

Body:
{
  "user_id": 5,
  "medicine_ids": [1, 2, 3]
}

Response (200):
{
  "success": true,
  "data": {
    "user_id": 5,
    "medicine_ids": [1, 2, 3],
    "valid_prescriptions": {
      "1": true,
      "2": false,
      "3": true
    },
    "all_valid": false
  }
}
```

---

## Database Schema

### `prescriptions` Table

```sql
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_date TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_expires_at ON prescriptions(expires_at);
CREATE INDEX idx_prescriptions_approved_by_id ON prescriptions(approved_by_id);
```

---

## Service Architecture

### Controller Layer (`prescriptionController.js`)

Handles HTTP request validation and response formatting. Key methods:
- `uploadPrescription()` - File upload with validation
- `getUserPrescriptions()` - Retrieve user's prescriptions (paginated)
- `getPrescription()` - Get single prescription with permission check
- `approvePrescription()` - Approve pending prescription
- `rejectPrescription()` - Reject pending prescription
- `getPendingPrescriptions()` - Admin view of pending queue
- `checkValidPrescriptions()` - Internal validation endpoint
- `health()` - Service health check

**Validation Rules:**
- File MIME types: `application/pdf`, `image/jpeg`, `image/png`
- File size: max 5MB
- Approval requires pharmacist/admin role
- Can only approve/reject "pending" status prescriptions

### Service Layer (`prescriptionService.js`)

Business logic and orchestration. Key methods:
- `uploadPrescription()` - Create prescription record with validation
- `getUserPrescriptions()` - Query with status filtering and pagination
- `getPrescription()` - Retrieve with user ownership validation
- `approvePrescription()` - Status transition with expiry calculation
- `rejectPrescription()` - Status transition with reason
- `getPendingPrescriptions()` - Admin queue retrieval
- `checkValidPrescriptions()` - Validate prescriptions for medicines
- `getPrescriptionExpiryStatus()` - Track expiry and renewal
- `getStatistics()` - Dashboard statistics

**Business Rules:**
- Prescription expires 1 year from approval date
- Only pending prescriptions can be approved/rejected
- Approval automatically sets approval_date and expires_at
- Users can only view their own prescriptions
- Admin/Pharmacist can view and approve any prescription

### Repository Layer (`prescriptionRepository.js`)

Database query methods:
- `create()` - Insert new prescription
- `findById()` - Fetch specific prescription
- `findByUserId()` - Fetch user's prescriptions with filtering
- `findByStatus()` - Fetch prescriptions by status (admin)
- `findApprovedByUserId()` - Get approved prescriptions for user
- `updateStatus()` - Update status with approval details
- `getStats()` - Aggregated statistics
- `getExpiredPrescriptions()` - Find expired approvals
- `getPrescriptionsExpiringsSoon()` - Find expiring in 30 days
- `countApprovedByPharmacist()` - Pharmacist performance metric

---

## Integration Points

### Order Service Integration

When an Order is created for a medicine requiring a prescription:

1. Order Service calls `/prescriptions/check/valid`
2. Prescription Service validates user has approved prescription
3. Order proceeds only if validation passes

**Example Flow:**
```
Order Creation
  ↓
Medicine requires prescription? YES
  ↓
Call Prescription Service /check/valid
  ↓
User has approved prescription? YES
  ↓
Order proceeds to payment
```

---

## File Upload Flow

1. **Upload Request**
   - Multer middleware validates file type and size
   - File stored locally in `./uploads/`
   - Filename: `prescription-{timestamp}-{random}.{ext}`

2. **Database Storage**
   - File URL stored in `prescriptions.file_url`
   - Prescription record created with `status='pending'`

3. **File Management**
   - Files persist in server storage
   - In production, consider cloud storage (S3, GCS)
   - Implement cleanup for rejected/deleted prescriptions

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NO_TOKEN` | 401 | Missing authorization token |
| `INVALID_TOKEN` | 401 | Token invalid or expired |
| `UNAUTHORIZED` | 403 | User lacks required role |
| `PRESCRIPTION_NOT_FOUND` | 404 | Prescription ID doesn't exist |
| `ACCESS_DENIED` | 403 | User cannot access prescription |
| `INVALID_FILE` | 400 | File format or size invalid |
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB limit |
| `INVALID_STATUS` | 400 | Invalid status transition |
| `ALREADY_APPROVED` | 409 | Cannot approve already approved |
| `INVALID_ROLE` | 403 | Only pharmacist/admin can approve |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Environment Variables

```bash
# Service Configuration
PRESCRIPTION_SERVICE_PORT=5004

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

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Prescription Rules
PRESCRIPTION_EXPIRY_DAYS=365
PRESCRIPTION_RENEWAL_WARNING_DAYS=30
```

---

## Performance Considerations

### Database Optimization
- **Indexes:** Queries on `user_id`, `status`, `expires_at`, `approved_by_id`
- **Pagination:** Limit 50 prescriptions per request
- **Denormalization:** Avoid N+1 queries with proper JOINs

### Caching Strategy (Future)
- Cache approved prescriptions for each user (30 min TTL)
- Invalidate cache on approval/rejection
- Cache statistics for admin dashboard (5 min TTL)

### File Management
- Implement file cleanup for rejected/deleted prescriptions
- Use CDN in production for file serving
- Consider cloud storage instead of local filesystem

---

## Testing Scenarios

### Upload Prescription
```bash
curl -X POST http://localhost:4000/prescriptions/upload \
  -H "Authorization: Bearer {token}" \
  -F "prescription_file=@prescription.pdf"
```

### Get User Prescriptions
```bash
curl -X GET http://localhost:4000/prescriptions?status=approved \
  -H "Authorization: Bearer {token}"
```

### Approve Prescription (Admin)
```bash
curl -X PUT http://localhost:4000/prescriptions/1/approve \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Verified with physician"}'
```

### Check Valid Prescriptions (Internal)
```bash
curl -X POST http://localhost:5004/prescriptions/check/valid \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "medicine_ids": [1, 2, 3]
  }'
```

---

## Deployment Checklist

- [ ] Database migration: Run schema creation script
- [ ] Environment variables configured (.env)
- [ ] JWT_SECRET set securely
- [ ] Upload directory created with proper permissions
- [ ] Redis connection verified
- [ ] API Gateway routes updated with Prescription Service endpoints
- [ ] Service registered in docker-compose.yml
- [ ] Health endpoint responding
- [ ] File uploads working end-to-end
- [ ] Approval workflow tested with admin account

---

## Troubleshooting

### Database Connection Fails
- Check DB_HOST, DB_PORT, DB_NAME, credentials
- Verify PostgreSQL is running
- Check network/firewall settings
- Review logs in `../../logs/error.log`

### File Upload Fails
- Verify upload directory exists and is writable
- Check file size (< 5MB)
- Verify MIME type (PDF, JPEG, PNG only)
- Check disk space

### Prescription Not Found
- Verify prescription ID exists
- Confirm user owns prescription (non-admin)
- Check prescription hasn't been deleted

### Approval Workflow Issues
- Verify uploading with pharmacist/admin role
- Ensure prescription status is "pending"
- Check JWT token is valid and includes role

---

## Future Enhancements

1. **Prescription Scanning**
   - OCR to extract medicine details from image
   - Auto-match medicines to prescription
   - Validate dosage/frequency

2. **Digital Prescription Support**
   - Integration with e-prescription systems
   - Digital signature validation
   - Compliance with healthcare regulations

3. **Expiry Management**
   - Automated renewal reminders (email/SMS)
   - One-click renewal for approved prescriptions
   - Insurance coverage tracking

4. **Analytics**
   - Prescription approval time metrics
   - Common rejection reasons
   - Top medicines by prescription

5. **Cloud Integration**
   - AWS S3/Google Cloud Storage for files
   - Automated backup and archival
   - HIPAA-compliant storage

---

## Support & Documentation

For additional help:
- Check logs in `../../logs/`
- Review API Gateway error responses
- Consult ARCHITECTURE.md for service integration patterns
- Review database schema in `db_schema.sql`
