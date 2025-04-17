const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Normal99!',
    database: 'eCommerceDB'
});
const promisePool = pool.promise();

// JWT Authentication Middleware
const JWT_SECRET = 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        req.user = user;
        next();
    });
};

// Apply bodyParser middleware to parse JSON bodies
router.use(bodyParser.json());

// Create a new order
router.post('/create', authenticateToken, async (req, res) => {
    const { items, total, paymentId } = req.body;
    const userId = req.user.userId;

    try {
        await promisePool.query('START TRANSACTION');

        const [orderResult] = await promisePool.query(
            'INSERT INTO Orders (Status, Orderdate, TotalPrice, Userid, PaymentID) VALUES (?, NOW(), ?, ?, ?)',
            ['Processing', total, userId, paymentId]
        );

        const transactionId = orderResult.insertId;

        // Add items to Includes table
        for (const item of items) {
            const productId = item.id.replace('item', ''); // Remove 'item' prefix
            await promisePool.query(
                'INSERT INTO Includes (Totalprice, Productid, Transactionid) VALUES (?, ?, ?)',
                [total, productId, transactionId]
            );
        }

        await promisePool.query('COMMIT');
        res.status(201).json({ 
            message: 'Order created successfully',
            orderId: transactionId,
            status: 'Processing'
        });
    } catch (error) {
        await promisePool.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// Get user's orders
router.get('/user', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        // Get orders with payment method details
        const [orders] = await promisePool.query(`
            SELECT 
                o.Transactionid, 
                o.Status, 
                o.Orderdate, 
                CAST(o.TotalPrice AS DECIMAL(10,2)) AS TotalPrice,
                p.CardholderName, 
                p.CardNumber
            FROM Orders o
            LEFT JOIN PaymentMethods p ON o.PaymentID = p.PaymentID
            WHERE o.Userid = ?
            ORDER BY o.Orderdate DESC
        `, [userId]);

        // For each order, get the items
        for (const order of orders) {
            const [items] = await promisePool.query(`
                SELECT i.Productid, p.Name, p.Price, p.image, i.Totalprice
                FROM Includes i
                JOIN Product p ON i.Productid = p.Productid
                WHERE i.Transactionid = ?
            `, [order.Transactionid]);
            
            order.items = items.map(item => ({
                id: `item${item.Productid}`,
                name: item.Name,
                price: item.Price,
                image: `/uploads/${item.image}`,
                total: item.Totalprice
            }));
        }

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});
module.exports = router;
