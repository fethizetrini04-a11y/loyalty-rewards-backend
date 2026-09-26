const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// منح نقاط للعميل (عند الشراء)
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { customer_id, points_amount, description } = req.body;
    const storeId = req.user.id;

    if (!customer_id || !points_amount) {
      return res.status(400).json({ error: 'معرف العميل والنقاط مطلوبة' });
    }

    // التحقق من أن العميل يتبع هذا المتجر
    const customer = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND store_owner_id = $2',
      [customer_id, storeId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    // إضافة النقاط
    await pool.query(
      'UPDATE customers SET points_balance = points_balance + $1, total_points_earned = total_points_earned + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [points_amount, customer_id]
    );

    // تسجيل العملية
    await pool.query(
      'INSERT INTO points_transactions (customer_id, transaction_type, points_amount, description) VALUES ($1, $2, $3, $4)',
      [customer_id, 'earned', points_amount, description || 'نقاط من شراء']
    );

    res.json({
      message: `تم إضافة ${points_amount} نقطة للعميل ✅`,
      customer_id,
      points_added: points_amount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في إضافة النقاط' });
  }
});

// استخدام نقاط (عند استرجاع كوبون)
router.post('/spend', verifyToken, async (req, res) => {
  try {
    const { customer_id, coupon_id } = req.body;
    const storeId = req.user.id;

    // التحقق من الكوبون
    const coupon = await pool.query(
      'SELECT * FROM coupons WHERE id = $1 AND store_owner_id = $2',
      [coupon_id, storeId]
    );

    if (coupon.rows.length === 0) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }

    const couponData = coupon.rows[0];

    // التحقق من العميل
    const customer = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND store_owner_id = $2',
      [customer_id, storeId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const customerData = customer.rows[0];

    // التحقق من وجود نقاط كافية
    if (customerData.points_balance < couponData.points_required) {
      return res.status(400).json({ 
        error: 'نقاط غير كافية',
        required: couponData.points_required,
        available: customerData.points_balance
      });
    }

    // التحقق من حدود الاستخدام
    if (couponData.max_uses && couponData.times_used >= couponData.max_uses) {
      return res.status(400).json({ error: 'تم استنفاد هذا الكوبون' });
    }

    // خصم النقاط
    await pool.query(
      'UPDATE customers SET points_balance = points_balance - $1, total_points_spent = total_points_spent + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [couponData.points_required, customer_id]
    );

    // تسجيل العملية
    const transaction = await pool.query(
      'INSERT INTO points_transactions (customer_id, transaction_type, points_amount, description, coupon_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id, 'spent', couponData.points_required, `استخدام كوبون: ${couponData.title}`, coupon_id]
    );

    // تسجيل استخدام الكوبون
    await pool.query(
      'INSERT INTO used_coupons (customer_id, coupon_id) VALUES ($1, $2)',
      [customer_id, coupon_id]
    );

    // تحديث عدد مرات استخدام الكوبون
    await pool.query(
      'UPDATE coupons SET times_used = times_used + 1 WHERE id = $1',
      [coupon_id]
    );

    res.json({
      message: 'تم استخدام الكوبون بنجاح ✅',
      coupon: couponData.title,
      points_spent: couponData.points_required,
      remaining_points: customerData.points_balance - couponData.points_required
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استخدام النقاط' });
  }
});

// الحصول على تاريخ معاملات العميل
router.get('/history/:customerId', verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const storeId = req.user.id;

    // التحقق من أن العميل يتبع هذا المتجر
    const customer = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND store_owner_id = $2',
      [customerId, storeId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const result = await pool.query(
      'SELECT * FROM points_transactions WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    res.json({
      customer_id: customerId,
      total_transactions: result.rows.length,
      transactions: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع السجل' });
  }
});

module.exports = router;