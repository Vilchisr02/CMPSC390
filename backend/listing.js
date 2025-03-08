const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Import JWT
const router = express.Router();

router.use(bodyParser.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Normal99!',
    database: 'eCommerceDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// JWT Secret Key (must match auth.js and payment.js)
const JWT_SECRET = 'your-secret-key';

// Middleware to authenticate user using JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized: Invalid or expired token' });
        }
        req.user = user; // Attach the decoded user data to the request object
        next();
    });
};

// Route to handle listing submissions (protected by JWT)
router.post('/listings', authenticateToken, async (req, res) => {
    const { itemName, itemPrice, itemCategory, shippingCost } = req.body;
    const userId = req.user.userId; // Extract userId from the token

    if (!itemName || !itemPrice || !itemCategory) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [productResult] = await promisePool.query(
            'INSERT INTO Product (Name, Price, Category, Shipping) VALUES (?, ?, ?, ?)',
            [itemName, itemPrice, itemCategory, shippingCost]
        );

        const productId = productResult.insertId;

        await promisePool.query(
            'INSERT INTO Seller (StockQuantity, Price, Userid, Productid) VALUES (?, ?, ?, ?)',
            [99, itemPrice, userId, productId]
        );

        res.status(201).json({ message: 'Listing added successfully', productId });
    } catch (error) {
        console.error('Error during listing submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to fetch all listings (products) - No authentication required
router.get('/listings', async (req, res) => {
    try {
        // Fetch all products from the Product table
        const [products] = await promisePool.query('SELECT * FROM Product');
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
