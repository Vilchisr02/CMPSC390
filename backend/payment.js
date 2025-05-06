const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); 
const router = express.Router();


router.use(bodyParser.json());


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'YOURPASSWORD', 
    database: 'eCommerceDB', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const promisePool = pool.promise();


const JWT_SECRET = 'your-secret-key';


const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId; 
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
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
