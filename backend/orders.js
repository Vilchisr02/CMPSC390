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
    const { items, subtotal, tax, total, paymentId } = req.body;
    const userId = req.user.userId;

    try {
        await promisePool.query('START TRANSACTION');

        // Calculate total quantity
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        const [orderResult] = await promisePool.query(
            'INSERT INTO Orders (Status, Orderdate, TotalPrice, Userid, PaymentID, TotalQuantity) VALUES (?, NOW(), ?, ?, ?, ?)',
            ['Processing', total, userId, paymentId, totalQuantity]
        );

        const transactionId = orderResult.insertId;

        // Add items to Includes table with quantities
        for (const item of items) {
            const productId = item.id.replace('item', '');
            const itemTotal = item.price * item.quantity;
            
            await promisePool.query(
                'INSERT INTO Includes (Totalprice, Productid, Transactionid, Quantity) VALUES (?, ?, ?, ?)',
                [itemTotal, productId, transactionId, item.quantity]
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
        const [orders] = await promisePool.query(`
            SELECT 
                o.Transactionid, 
                o.Status, 
                o.Orderdate, 
                CAST(o.TotalPrice AS DECIMAL(10,2)) AS TotalPrice,
                o.TotalQuantity,
                p.CardholderName, 
                p.CardNumber
            FROM Orders o
            LEFT JOIN PaymentMethods p ON o.PaymentID = p.PaymentID
            WHERE o.Userid = ?
            ORDER BY o.Orderdate DESC
        `, [userId]);

        for (const order of orders) {
            const [items] = await promisePool.query(`
                SELECT 
                    i.Productid, 
                    p.Name, 
                    p.Price, 
                    p.image, 
                    i.Totalprice,
                    i.Quantity
                FROM Includes i
                JOIN Product p ON i.Productid = p.Productid
                WHERE i.Transactionid = ?
            `, [order.Transactionid]);
            
            order.items = items.map(item => ({
                id: `item${item.Productid}`,
                name: item.Name,
                price: item.Price,
                image: `/uploads/${item.image}`,
                total: item.Totalprice,
                quantity: item.Quantity
            }));
        }

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Function to update order statuses
async function updateOrderStatuses() {
    try {
        // First update Processing -> Shipped
        const [processingOrders] = await promisePool.query(
            'SELECT Transactionid FROM Orders WHERE Status = ?',
            ['Processing']
        );

        if (processingOrders.length > 0) {
            await promisePool.query(
                'UPDATE Orders SET Status = ? WHERE Status = ?',
                ['Shipped', 'Processing']
            );
        }

        // Then update Shipped -> Delivered
        const [shippedOrders] = await promisePool.query(
            'SELECT Transactionid FROM Orders WHERE Status = ?',
            ['Shipped']
        );

        if (shippedOrders.length > 0) {
            await promisePool.query(
                'UPDATE Orders SET Status = ? WHERE Status = ?',
                ['Delivered', 'Shipped']
            );
        }
    } catch (error) {
        console.error('Error updating order statuses:', error);
    }
}

// Update statuses every 30 seconds, but stagger the updates
setInterval(async () => {
    // First update Processing -> Shipped
    await updateStatus('Processing', 'Shipped');
    
    // Wait 30 seconds before Shipped -> Delivered
    setTimeout(async () => {
        await updateStatus('Shipped', 'Delivered');
    }, 30000);
}, 60000); // Full cycle every 60 seconds

async function updateStatus(fromStatus, toStatus) {
    try {
        const [orders] = await promisePool.query(
            'SELECT Transactionid FROM Orders WHERE Status = ?',
            [fromStatus]
        );

        if (orders.length > 0) {
            await promisePool.query(
                'UPDATE Orders SET Status = ? WHERE Status = ?',
                [toStatus, fromStatus]
            );
        }
    } catch (error) {
        console.error(`Error updating status from ${fromStatus} to ${toStatus}:`, error);
    }
}

// Call it once when starting the server
updateOrderStatuses();

module.exports = router;
