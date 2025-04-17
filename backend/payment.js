const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Import JWT
const router = express.Router();

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'Normal99!', // Replace with your MySQL password
    database: 'eCommerceDB', // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify the pool for async/await usage
const promisePool = pool.promise();

// JWT Secret Key (should be stored in environment variables in production)
const JWT_SECRET = 'your-secret-key';

// Middleware to authenticate user using JWT
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        // Check if header is in format "Bearer <token>"
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({ message: 'Invalid authorization format. Use: Bearer <token>' });
        }

        const token = tokenParts[1];
        
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify the user exists in database
        const [users] = await promisePool.query(
            'SELECT Userid FROM Users WHERE Userid = ?',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user information to the request
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        
        res.status(500).json({ message: 'Authentication failed' });
    }
};

// Save payment method route
router.post('/save-payment', authenticateUser, async (req, res) => {
    const { cardNumber, expirationDate, cvv, cardholderName } = req.body;
    const userId = req.userId;

    // Validate input
    if (!cardNumber || !expirationDate || !cvv || !cardholderName) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Insert the new payment method into the database
        const [result] = await promisePool.query(
            'INSERT INTO PaymentMethods (Userid, CardNumber, ExpirationDate, CVV, CardholderName) VALUES (?, ?, ?, ?, ?)',
            [userId, cardNumber, expirationDate, cvv, cardholderName]
        );

        res.status(201).json({ message: 'Payment method saved successfully', paymentId: result.insertId });
    } catch (error) {
        console.error('Error saving payment method:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// View payment methods route
router.get('/view-payments', authenticateUser, async (req, res) => {
    const userId = req.userId;

    try {
        // Fetch all payment methods for the logged-in user
        const [paymentMethods] = await promisePool.query(
            'SELECT * FROM PaymentMethods WHERE Userid = ?',
            [userId]
        );

        res.status(200).json({ paymentMethods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
