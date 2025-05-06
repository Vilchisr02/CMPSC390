const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

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

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/reviews', authenticateToken, async (req, res) => {
    try {        
        const { productId, rating, comment } = req.body;
        
        if (!productId || !rating || !comment) {
            return res.status(400).json({ 
                success: false,
                error: "Missing required fields",
            });
        }

        const [seller] = await promisePool.query(
            "SELECT SellerID FROM Seller WHERE Productid = ?", 
            [productId]
        );

        if (!seller.length) {
            return res.status(404).json({
                success: false,
                error: "Product not found"
            });
        }

        await promisePool.query(
            "INSERT INTO Reviews (Userid, SellerID, Rating, Comment, ReviewDate) VALUES (?, ?, ?, ?, NOW())",
            [req.user.userId, seller[0].SellerID, rating, comment]
        );

        res.status(200).json({ 
            success: true,
            message: "Review submitted successfully"
        });

    } catch (error) {
        console.error("Review submission error:", error);
        res.status(500).json({ 
            success: false,
            error: "Server error",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/products', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    try {
        // First verify the user exists
        const [userCheck] = await promisePool.query(
            'SELECT Userid FROM Users WHERE Userid = ?', 
            [userId]
        );

        if (userCheck.length === 0) {
            console.log(`User not found with ID: ${userId}`);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const [products] = await promisePool.query(`
            SELECT DISTINCT P.Productid, P.Name, S.SellerID
            FROM Orders O
            JOIN Includes I ON O.Transactionid = I.Transactionid
            JOIN Product P ON I.Productid = P.Productid
            JOIN Seller S ON P.Productid = S.Productid
            WHERE O.Userid = ?
        `, [userId]);

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                products: [],
                message: "No purchased products found"
            });
        }

        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Detailed error fetching purchased products:', {
            error: error.message,
            stack: error.stack,
            userId: userId
        });
        res.status(500).json({
            success: false,
            message: "Error loading purchased products",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/reviews/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        const [reviews] = await promisePool.query(`
            SELECT r.*, u.Username 
            FROM Reviews r
            JOIN Users u ON r.Userid = u.Userid
            JOIN Seller s ON r.SellerID = s.SellerID
            WHERE s.Productid = ?
            ORDER BY r.ReviewDate DESC
        `, [productId]);

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;
