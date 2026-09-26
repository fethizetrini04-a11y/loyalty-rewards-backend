const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// استيراد المسارات
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const customerRoutes = require('./routes/customer');
const couponRoutes = require('./routes/coupon');
const pointsRoutes = require('./routes/points');

// استخدام المسارات
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/points', pointsRoutes);

// مسار الاختبار
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// معالج الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'حدث خطأ ما',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_DATABASE}`);
});