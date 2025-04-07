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
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId; // Attach the user ID to the request object
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
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
