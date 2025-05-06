const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.use(bodyParser.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Password',
    database: 'eCommerceDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const JWT_SECRET = 'your-secret-key';

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({ message: 'Invalid authorization format. Use: Bearer <token>' });
        }

        const token = tokenParts[1];
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [users] = await promisePool.query(
            'SELECT Userid FROM Users WHERE Userid = ?',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

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

router.post('/save-payment', authenticateUser, async (req, res) => {
    const { cardNumber, expirationDate, cvv, cardholderName } = req.body;
    const userId = req.userId;

    if (!cardNumber || !expirationDate || !cvv || !cardholderName) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
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

router.get('/view-payments', authenticateUser, async (req, res) => {
    const userId = req.userId;

    try {
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
