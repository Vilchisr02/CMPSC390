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

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/listings', authenticateToken, upload.single('productImage'), async (req, res) => {
    const { itemName, itemPrice, itemQuantity, itemCategory, shippingCost, itemDescription } = req.body;
    const userId = req.user.userId;
    const imageFileName = req.file ? req.file.filename : null;

    if (!itemName || !itemPrice || !itemQuantity || !itemCategory || !shippingCost || !imageFileName) {
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
            [itemQuantity, itemPrice, userId, productId]
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
        const [products] = await promisePool.query(`
            SELECT Product.*, Seller.StockQuantity, Users.Username AS sellerName 
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

router.post('/update-stock', authenticateToken, async (req, res) => {
    const { items } = req.body;
    
    try {
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid items array' });
        }

        await promisePool.query('START TRANSACTION');

        for (const item of items) {
            // Decrease stock quantity
            await promisePool.query(
                'UPDATE Seller SET StockQuantity = StockQuantity - ? WHERE Productid = ?',
                [item.quantity, item.id]
            );
            
            // Verify stock didn't go negative
            const [product] = await promisePool.query(
                'SELECT StockQuantity FROM Seller WHERE Productid = ?',
                [item.id]
            );
            
            if (product[0].StockQuantity < 0) {
                await promisePool.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `Insufficient stock for product ${item.id}` 
                });
            }
        }

        await promisePool.query('COMMIT');
        res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
        await promisePool.query('ROLLBACK');
        console.error('Error updating stock:', error);
        res.status(500).json({ message: 'Error updating stock' });
    }
});

router.get('/listings/user', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const [listings] = await promisePool.query(`
            SELECT 
                Product.*, 
                Seller.StockQuantity,
                CASE 
                    WHEN Seller.StockQuantity <= 0 THEN 'Out of Stock'
                    ELSE 'Active'
                END AS status
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

