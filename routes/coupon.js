const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// الحصول على جميع الكوبونات
router.get('/', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM coupons WHERE store_owner_id = $1 ORDER BY created_at DESC',
      [storeId]
    );

    res.json({
      total: result.rows.length,
      coupons: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع الكوبونات' });
  }
});

// إضافة كوبون جديد
router.post('/', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;
    const { 
      title, 
      description, 
      discount_type, 
      discount_value, 
      points_required, 
      max_uses, 
      end_date 
    } = req.body;

    if (!title || !discount_type || !discount_value || !points_required) {
      return res.status(400).json({ error: 'البيانات المطلوبة غير كاملة' });
    }

    const result = await pool.query(
      'INSERT INTO coupons (store_owner_id, title, description, discount_type, discount_value, points_required, max_uses, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [storeId, title, description, discount_type, discount_value, points_required, max_uses, end_date]
    );

    res.status(201).json({
      message: 'تم إضافة الكوبون بنجاح ✅',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في إضافة الكوبون' });
  }
});

// الحصول على كوبون محدد
router.get('/:couponId', verifyToken, async (req, res) => {
  try {
    const { couponId } = req.params;
    const storeId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM coupons WHERE id = $1 AND store_owner_id = $2',
      [couponId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع الكوبون' });
  }
});

// تحديث كوبون
router.put('/:couponId', verifyToken, async (req, res) => {
  try {
    const { couponId } = req.params;
    const storeId = req.user.id;
    const { title, description, discount_type, discount_value, points_required, max_uses, end_date, is_active } = req.body;

    const result = await pool.query(
      'UPDATE coupons SET title = $1, description = $2, discount_type = $3, discount_value = $4, points_required = $5, max_uses = $6, end_date = $7, is_active = $8 WHERE id = $9 AND store_owner_id = $10 RETURNING *',
      [title, description, discount_type, discount_value, points_required, max_uses, end_date, is_active, couponId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }

    res.json({
      message: 'تم تحديث الكوبون بنجاح ✅',
      coupon: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في تحديث الكوبون' });
  }
});

// حذف كوبون
router.delete('/:couponId', verifyToken, async (req, res) => {
  try {
    const { couponId } = req.params;
    const storeId = req.user.id;

    const result = await pool.query(
      'UPDATE coupons SET is_active = false WHERE id = $1 AND store_owner_id = $2 RETURNING id',
      [couponId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }

    res.json({ message: 'تم حذف الكوبون بنجاح ✅' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في حذف الكوبون' });
  }
});

// الحصول على الكوبونات المستخدمة
router.get('/:couponId/used', verifyToken, async (req, res) => {
  try {
    const { couponId } = req.params;
    const storeId = req.user.id;

    // التحقق من أن الكوبون يتبع هذا المتجر
    const coupon = await pool.query(
      'SELECT * FROM coupons WHERE id = $1 AND store_owner_id = $2',
      [couponId, storeId]
    );

    if (coupon.rows.length === 0) {
      return res.status(404).json({ error: 'الكوبون غير موجود' });
    }

    const result = await pool.query(
      'SELECT uc.used_at, c.phone, c.name FROM used_coupons uc JOIN customers c ON uc.customer_id = c.id WHERE uc.coupon_id = $1 ORDER BY uc.used_at DESC',
      [couponId]
    );

    res.json({
      coupon_id: couponId,
      times_used: result.rows.length,
      used_by: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع البيانات' });
  }
});

module.exports = router;