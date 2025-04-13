const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');


// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '----',
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

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/listings', authenticateToken, upload.single('productImage'), async (req, res) => {
    const { itemName, itemPrice, itemCategory, shippingCost, itemDescription } = req.body;
    const userId = req.user.userId;
    const imageFileName = req.file ? req.file.filename : null;

    if (!itemName || !itemPrice || !itemCategory || !shippingCost || !imageFileName) {
        return res.status(400).json({ message: 'All fields including image are required' });
    }

    try {
        const [productResult] = await promisePool.query(
            'INSERT INTO Product (Name, Price, Category, Shipping, image, description, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [itemName, itemPrice, itemCategory, shippingCost, imageFileName, itemDescription]
        );

        const productId = productResult.insertId;

        await promisePool.query(
            'INSERT INTO Seller (StockQuantity, Price, Userid, Productid) VALUES (?, ?, ?, ?)',
            [1, itemPrice, userId, productId]
        );

        res.status(201).json({ 
            message: 'Listing added successfully', 
            productId,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/listings', async (req, res) => {
    try {
        // Fetch all products from the Product table along with the seller's name
        const [products] = await promisePool.query(`
            SELECT Product.*, Users.Username AS sellerName 
            FROM Product 
            JOIN Seller ON Product.Productid = Seller.Productid 
            JOIN Users ON Seller.Userid = Users.Userid
        `);
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/listings/user', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const [listings] = await promisePool.query(`
            SELECT Product.*, Seller.StockQuantity
            FROM Product 
            JOIN Seller ON Product.Productid = Seller.Productid 
            WHERE Seller.Userid = ?
        `, [userId]);
        
        res.status(200).json({ listings });
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

