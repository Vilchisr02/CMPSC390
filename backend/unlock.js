const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'BdIaP1!!',
    database: 'eCommerceDB'
});
const promisePool = pool.promise();

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

// Check if user has seller status (has posted any products)
router.get('/check-seller-status', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const [result] = await promisePool.query(
            'SELECT COUNT(*) AS count FROM Seller WHERE Userid = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            hasPostedProduct: result[0].count > 0
        });
    } catch (error) {
        console.error('Error checking seller status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
});

router.post('/unlock-seller', authenticateToken, async (req, res) => {
    res.status(200).json({
        message: 'Seller status is unlocked when you create your first listing'
    });
});

module.exports = router;
