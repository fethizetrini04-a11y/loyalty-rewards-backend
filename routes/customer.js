const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// الحصول على جميع العملاء
router.get('/', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;

    const result = await pool.query(
      'SELECT id, phone, email, name, points_balance, total_points_earned, total_points_spent, created_at FROM customers WHERE store_owner_id = $1 ORDER BY created_at DESC',
      [storeId]
    );

    res.json({
      total: result.rows.length,
      customers: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع العملاء' });
  }
});

// إضافة عميل جديد
router.post('/', verifyToken, async (req, res) => {
  try {
    const storeId = req.user.id;
    const { phone, email, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
    }

    // التحقق من عدم تكرار رقم الهاتف
    const existing = await pool.query(
      'SELECT * FROM customers WHERE store_owner_id = $1 AND phone = $2',
      [storeId, phone]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'العميل موجود بالفعل' });
    }

    const result = await pool.query(
      'INSERT INTO customers (store_owner_id, phone, email, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [storeId, phone, email, name]
    );

    res.status(201).json({
      message: 'تم إضافة العميل بنجاح ✅',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في إضافة العميل' });
  }
});

// الحصول على بيانات عميل محدد
router.get('/:customerId', verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const storeId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND store_owner_id = $2',
      [customerId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في استرجاع بيانات العميل' });
  }
});

// تحديث اسم العميل
router.put('/:customerId', verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, email } = req.body;
    const storeId = req.user.id;

    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND store_owner_id = $4 RETURNING *',
      [name, email, customerId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    res.json({
      message: 'تم تحديث البيانات بنجاح ✅',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في تحديث البيانات' });
  }
});

// حذف العميل
router.delete('/:customerId', verifyToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const storeId = req.user.id;

    const result = await pool.query(
      'UPDATE customers SET is_active = false WHERE id = $1 AND store_owner_id = $2 RETURNING id',
      [customerId, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    res.json({ message: 'تم حذف العميل بنجاح ✅' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في حذف العميل' });
  }
});

module.exports = router;