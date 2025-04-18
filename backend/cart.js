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
    
    // If no token, proceed as guest
    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        req.user = user;
        next();
    });
};

// Apply bodyParser middleware to parse JSON bodies
router.use(bodyParser.json());

// Save cart to database
router.post('/save', authenticateToken, async (req, res) => {
    const { items } = req.body;
    
    try {
        if (!req.user) {
            return res.status(200).json({ message: 'Guest cart saved locally' });
        }

        // Validate items
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid items array' });
        }

        await promisePool.query('START TRANSACTION');
        
        // First validate stock for all items
        for (const item of items) {
            const [product] = await promisePool.query(
                'SELECT p.Productid, s.StockQuantity FROM Product p JOIN Seller s ON p.Productid = s.Productid WHERE p.Productid = ?',
                [item.id]
            );
            
            if (product.length === 0) {
                await promisePool.query('ROLLBACK');
                return res.status(400).json({ message: `Product ${item.id} not found` });
            }
            
            if (product[0].StockQuantity < item.quantity) {
                await promisePool.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `Not enough stock for product ${item.id}. Available: ${product[0].StockQuantity}` 
                });
            }
        }

        // Get or create cart
        const [existingCart] = await promisePool.query(
            'SELECT Cartid FROM Cart WHERE Userid = ?',
            [req.user.userId]
        );

        let cartId;
        if (existingCart.length > 0) {
            cartId = existingCart[0].Cartid;
            await promisePool.query(
                'DELETE FROM Added_to WHERE Cartid = ?',
                [cartId]
            );
        } else {
            const [newCart] = await promisePool.query(
                'INSERT INTO Cart (Userid) VALUES (?)',
                [req.user.userId]
            );
            cartId = newCart.insertId;
        }

        // Add items with validation
        if (items.length > 0) {
            for (const item of items) {
                await promisePool.query(
                    'INSERT INTO Added_to (Productid, Cartid, Quantity) VALUES (?, ?, ?)',
                    [item.id, cartId, item.quantity || 1]
                );
            }
        }

        await promisePool.query('COMMIT');
        res.status(200).json({ message: 'Cart saved successfully', cartId });
    } catch (error) {
        await promisePool.query('ROLLBACK');
        console.error('Error saving cart:', error);
        res.status(500).json({ message: 'Error saving cart' });
    }
});

// Get user's cart from database
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({ items: [] });
        }

        const [cartItems] = await promisePool.query(`
            SELECT p.Productid, p.Name, p.Price, p.Shipping, p.image, p.Category, a.Quantity
            FROM Added_to a
            JOIN Product p ON a.Productid = p.Productid
            JOIN Cart c ON a.Cartid = c.Cartid
            WHERE c.Userid = ?
        `, [req.user.userId]);

        const formattedItems = cartItems.map(item => ({
            id: `item${item.Productid}`,
            name: item.Name,
            price: item.Price,
            shipping: item.Shipping,
            image: `/uploads/${item.image}`,
            category: item.Category,
            quantity: item.Quantity // Use the actual quantity from database
        }));

        res.status(200).json({ items: formattedItems });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

module.exports = router;
