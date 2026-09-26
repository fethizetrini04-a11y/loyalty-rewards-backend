-- إنشاء قاعدة البيانات
CREATE DATABASE loyalty_rewards_db;

-- جدول أصحاب المتاجر (Store Owners)
CREATE TABLE store_owners (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول العملاء (Customers)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    store_owner_id INTEGER NOT NULL REFERENCES store_owners(id),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    points_balance INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_owner_id, phone)
);

-- جدول الكوبونات والعروض (Coupons/Offers)
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    store_owner_id INTEGER NOT NULL REFERENCES store_owners(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50),
    discount_value DECIMAL(10, 2) NOT NULL,
    points_required INTEGER NOT NULL,
    max_uses INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول معاملات النقاط (Points Transactions)
CREATE TABLE points_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    transaction_type VARCHAR(50),
    points_amount INTEGER NOT NULL,
    description VARCHAR(255),
    coupon_id INTEGER REFERENCES coupons(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الكوبونات المستخدمة (Used Coupons)
CREATE TABLE used_coupons (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    coupon_id INTEGER NOT NULL REFERENCES coupons(id),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفواتير والمدفوعات (Invoices)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    store_owner_id INTEGER NOT NULL REFERENCES store_owners(id),
    amount DECIMAL(10, 2) NOT NULL,
    invoice_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMP,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الفهارس لتحسين الأداء
CREATE INDEX idx_store_owner_id ON customers(store_owner_id);
CREATE INDEX idx_customer_id ON points_transactions(customer_id);
CREATE INDEX idx_coupon_store ON coupons(store_owner_id);
CREATE INDEX idx_store_owner_email ON store_owners(email);