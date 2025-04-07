const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Set up MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'YOURPASSWORD',
    database: 'eCommerceDB'
});

const promisePool = pool.promise();

// 🔁 Update order status
router.post('/update-order-status', async (req, res) => {
    const { order_id, status } = req.body;

    try {
        const [result] = await promisePool.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, order_id]
        );
        res.json({ success: result.affectedRows > 0 });
    } catch (err) {
        console.error("MySQL update error:", err);
        res.status(500).json({ success: false });
    }
});

// 📥 Get orders for a user
router.get('/get-user-orders', async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const user_id = req.session.user.id;

    try {
        const [orders] = await promisePool.query(
            'SELECT * FROM Orders WHERE Userid = ?',
            [user_id]
        );
        res.json(orders);
    } catch (err) {
        console.error("MySQL fetch error:", err);
        res.status(500).json({ success: false });
    }
});



router.post('/order', async (req, res) => {
    const { total } = req.body;

    if (!req.session.user || !req.session.user.id || !total) {
        return res.status(400).json({ error: 'Missing user session or total' });
    }

    const buyer_id = req.session.user.id;

    try {
        await promisePool.query(
            'INSERT INTO Orders (Userid, TotalPrice, Status, Orderdate, PaymentID) VALUES (?, ?, ?, NOW(), 1)',
            [buyer_id, total, 'processing']
        );

        res.status(201).json({ message: 'Order placed successfully' });
    } catch (err) {
        console.error('Error inserting order:', err);
        res.status(500).json({ error: 'Failed to insert order' });
    }
});



module.exports = router;

