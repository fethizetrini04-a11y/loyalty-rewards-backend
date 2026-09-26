const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// الحصول على بيانات المتجر
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;

    const result = await pool.query(
      'SELECT id, store_name, email, phone, address, logo_url, subscription_plan, subscription_expires_at, created_at FROM store_owners WHERE id = $1',
      [storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المتجر غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع البيانات' });
  }
});

// تحديث بيانات المتجر
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;
    const { store_name, phone, address, logo_url } = req.body;

    const result = await pool.query(
      'UPDATE store_owners SET store_name = $1, phone = $2, address = $3, logo_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [store_name, phone, address, logo_url, storeId]
    );

    res.json({
      message: 'تم تحديث البيانات بنجاح ✅',
      store: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في تحديث البيانات' });
  }
});

// إحصائيات المتجر
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;

    // عدد العملاء
    const customersResult = await pool.query(
      'SELECT COUNT(*) as total FROM customers WHERE store_owner_id = $1',
      [storeId]
    );

    // عدد الكوبونات
    const couponsResult = await pool.query(
      'SELECT COUNT(*) as total FROM coupons WHERE store_owner_id = $1',
      [storeId]
    );

    // إجمالي النقاط الممنوحة
    const pointsResult = await pool.query(
      'SELECT SUM(total_points_earned) as total FROM customers WHERE store_owner_id = $1',
      [storeId]
    );

    res.json({
      total_customers: customersResult.rows[0].total,
      total_coupons: couponsResult.rows[0].total,
      total_points_given: pointsResult.rows[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع الإحصائيات' });
  }
});

module.exports = router;