-- Drug Delivery E-commerce Platform - PostgreSQL Database Schema
-- This script creates all necessary tables for the system

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- user, admin, pharmacist, delivery_agent
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- USER ADDRESSES TABLE
-- ============================================================

CREATE TABLE user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_default_address PER USER (user_id, is_default) WHERE is_default = true
);

CREATE INDEX idx_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_addresses_default ON user_addresses(is_default);

-- ============================================================
-- MEDICINES TABLE
-- ============================================================

CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  expiry_date DATE,
  requires_prescription BOOLEAN DEFAULT false,
  manufacturer VARCHAR(255),
  batch_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for faster queries
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_requires_prescription ON medicines(requires_prescription);
CREATE INDEX idx_medicines_stock ON medicines(quantity_in_stock);
CREATE INDEX idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX idx_medicines_active ON medicines(is_active);

-- ============================================================
-- PRESCRIPTIONS TABLE
-- ============================================================

CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL, -- S3 URL or local path
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  uploaded_by_id INTEGER REFERENCES users(id), -- For audit trail
  approved_by_id INTEGER REFERENCES users(id), -- Pharmacist/Admin who approved
  approval_notes TEXT,
  medicine_id INTEGER REFERENCES medicines(id), -- Optional: Which medicine does this prescription allow
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMP,
  expires_at TIMESTAMP -- Prescription validity period
);

CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at);
CREATE INDEX idx_prescriptions_medicine_id ON prescriptions(medicine_id);

-- ============================================================
-- ORDERS TABLE
-- ============================================================

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  shipping_address_id INTEGER REFERENCES user_addresses(id),
  delivery_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  idempotency_key VARCHAR(100) UNIQUE -- For preventing duplicate orders
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_idempotency_key ON orders(idempotency_key);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase > 0),
  requires_prescription_id INTEGER REFERENCES prescriptions(id), -- Which prescription allows this item
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_medicine_id ON order_items(medicine_id);
CREATE INDEX idx_order_items_prescription_id ON order_items(requires_prescription_id);

-- ============================================================
-- DELIVERIES TABLE
-- ============================================================

CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_agent_id INTEGER REFERENCES users(id), -- Assigned delivery agent
  status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- assigned, in_transit, attempted, delivered, failed, returned
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  current_location VARCHAR(255),
  delivery_notes TEXT,
  signature_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_agent_id ON deliveries(delivery_agent_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at);

-- ============================================================
-- PAYMENTS TABLE (Optional - for payment history)
-- ============================================================

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50), -- credit_card, debit_card, upi, net_banking
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  transaction_id VARCHAR(100) UNIQUE,
  payment_gateway VARCHAR(100), -- stripe, razorpay, paypal
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- ============================================================
-- STOCK RESERVATIONS TABLE (For handling concurrent orders)
-- ============================================================

CREATE TABLE stock_reservations (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
  reservation_expires_at TIMESTAMP NOT NULL, -- Automatically release after timeout
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_reservations_medicine_id ON stock_reservations(medicine_id);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(reservation_expires_at);
CREATE INDEX idx_stock_reservations_order_id ON stock_reservations(order_id);

-- ============================================================
-- AUDIT LOG TABLE (For compliance and debugging)
-- ============================================================

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  user_id INTEGER REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- CONSTRAINTS & TRIGGERS
-- ============================================================

-- Update timestamp on users table
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Update timestamp on medicines table
CREATE OR REPLACE FUNCTION update_medicines_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medicines_timestamp_trigger
BEFORE UPDATE ON medicines
FOR EACH ROW
EXECUTE FUNCTION update_medicines_timestamp();

-- Update timestamp on orders table
CREATE OR REPLACE FUNCTION update_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_timestamp_trigger
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_timestamp();

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- Insert sample users
INSERT INTO users (email, password, name, role) VALUES
('admin@example.com', '$2b$10$...hashedpassword...', 'Admin User', 'admin'),
('pharmacist@example.com', '$2b$10$...hashedpassword...', 'Pharmacist User', 'pharmacist'),
('user@example.com', '$2b$10$...hashedpassword...', 'Regular User', 'user'),
('delivery@example.com', '$2b$10$...hashedpassword...', 'Delivery Agent', 'delivery_agent');

-- Insert sample medicines
INSERT INTO medicines (name, description, price, quantity_in_stock, requires_prescription, manufacturer) VALUES
('Aspirin 100mg', 'Pain reliever and blood thinner', 5.99, 100, false, 'Bayer'),
('Amoxicillin 500mg', 'Antibiotic - Requires prescription', 12.99, 50, true, 'GSK'),
('Metformin 500mg', 'Diabetes medication - Requires prescription', 8.99, 75, true, 'Novo Nordisk'),
('Vitamin C 1000mg', 'Vitamin supplement', 3.49, 200, false, 'Natrol');

-- ============================================================
-- QUERY PERFORMANCE NOTES
-- ============================================================

/*
INDEXING STRATEGY:

1. User lookups:
   - Query: SELECT * FROM users WHERE email = ?
   - Index: idx_users_email
   - Expected: < 1ms

2. Finding user orders:
   - Query: SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
   - Index: idx_orders_user_id (+ idx_orders_created_at for sorting)
   - Expected: < 10ms for typical users

3. Stock checks:
   - Query: SELECT quantity_in_stock FROM medicines WHERE id = ?
   - Index: (Primary key)
   - Expected: < 1ms

4. Order status tracking:
   - Query: SELECT * FROM orders WHERE status = 'pending' AND created_at > ?
   - Index: idx_orders_status (composite with created_at)
   - Expected: < 50ms

CONCURRENCY HANDLING:

1. Stock updates:
   - Use SELECT ... FOR UPDATE to lock row during transaction
   - Update medicines.quantity_in_stock atomically
   - Prevents overselling

2. Order creation:
   - Wrap in transaction: BEGIN ... COMMIT/ROLLBACK
   - Lock relevant medicines and user
   - Atomic operation: create order + reserve stock + update medicine

3. Payment processing:
   - Atomic update: order.payment_status + payment insert
   - Rollback entire transaction if payment fails

CONSTRAINTS:

1. Email uniqueness: Prevents duplicate users
2. Price > 0: Prevents negative prices
3. Stock >= 0: Prevents negative inventory
4. Quantity > 0: Order items must be positive
5. Idempotency key unique: Prevents duplicate orders from same request
*/
