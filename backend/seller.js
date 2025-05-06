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

router.get('/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const [sellerInfo] = await promisePool.query(
            `SELECT U.Fname FROM Users U WHERE U.Userid = ?`,
            [userId]
        );

        const [financialData] = await promisePool.query(
            `SELECT 
                /* Earnings from products sold */
                COALESCE(
                    (SELECT SUM(O.TotalPrice * (I.Quantity * P.Price) / 
                               (SELECT SUM(I2.Quantity * P2.Price) 
                                FROM Includes I2 
                                JOIN Product P2 ON I2.Productid = P2.Productid
                                WHERE I2.Transactionid = O.Transactionid))
                     FROM Orders O
                     JOIN Includes I ON O.Transactionid = I.Transactionid
                     JOIN Product P ON I.Productid = P.Productid
                     JOIN Seller S ON I.Productid = S.Productid
                     WHERE S.Userid = ?
                     AND O.Status = 'Delivered'
                    ), 0) AS earnings,
                
                /* Deductions from products purchased */
                COALESCE(
                    (SELECT SUM(O.TotalPrice * (I.Quantity * P.Price) / 
                               (SELECT SUM(I2.Quantity * P2.Price) 
                                FROM Includes I2 
                                JOIN Product P2 ON I2.Productid = P2.Productid
                                WHERE I2.Transactionid = O.Transactionid))
                     FROM Orders O
                     JOIN Includes I ON O.Transactionid = I.Transactionid
                     JOIN Product P ON I.Productid = P.Productid
                     JOIN Seller S ON I.Productid = S.Productid
                     WHERE O.Userid = ?
                     AND S.Userid != ?
                     AND O.Status = 'Delivered'
                    ), 0) AS deductions,
                
                /* Shipping costs */
                COALESCE(
                    (SELECT SUM(I.Quantity * P.Shipping)
                     FROM Includes I
                     JOIN Product P ON I.Productid = P.Productid
                     JOIN Orders O ON I.Transactionid = O.Transactionid
                     WHERE O.Userid = ?
                     AND O.Status = 'Delivered'
                    ), 0) AS shipping
             FROM Users
             WHERE Userid = ?`,
            [userId, userId, userId, userId, userId]
        );

        res.status(200).json({
            success: true,
            sellerData: {
                name: sellerInfo[0].Fname,
                earnings: financialData[0].earnings,
                deductions: financialData[0].deductions + financialData[0].shipping,
                netEarnings: financialData[0].earnings - (financialData[0].deductions + financialData[0].shipping)
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load financial data",
            error: error.message
        });
    }
});

router.get('/weekly-orders', authenticateToken, async (req, res) => {
    try {
        const [products] = await promisePool.query(
            `SELECT Productid FROM Seller WHERE Userid = ?`,
            [req.user.userId]
        );

        if (!products.length) {
            return res.status(200).json({
                success: true,
                weeklyOrders: []
            });
        }

        const productIds = products.map(p => p.Productid);

        const [weeklyOrders] = await promisePool.query(
          `SELECT 
              DATE_FORMAT(CONVERT_TZ(O.Orderdate, '+00:00', ?), '%Y-%m-%d') as day, 
              COUNT(DISTINCT O.Transactionid) as total_orders
           FROM Orders O
           JOIN Includes I ON O.Transactionid = I.Transactionid
           WHERE I.Productid IN (?)
           AND O.Orderdate >= DATE(CONVERT_TZ(NOW(), '+00:00', ?)) - INTERVAL 6 DAY
           AND O.Status = 'Delivered'
           GROUP BY day
           ORDER BY day ASC`,
          [process.env.TZ || '+00:00', productIds, process.env.TZ || '+00:00']
        );

        const days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        const completeData = days.map(day => {
            const found = weeklyOrders.find(o => o.day === day);
            return found || { day, total_orders: 0 };
        });

        res.status(200).json({
            success: true,
            weeklyOrders: completeData
        });

    } catch (error) {
        console.error("Weekly orders error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message
        });
    }
});

router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const [sellerInfo] = await promisePool.query(
            `SELECT SellerID FROM Seller WHERE UserID = ?`,
            [req.user.userId]
        );

        if (!sellerInfo.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Seller not found" 
            });
        }

        const sellerId = sellerInfo[0].SellerID;

        const [orders] = await promisePool.query(
            `SELECT 
                O.Transactionid, 
                O.TotalPrice, 
                O.OrderDate, 
                O.Status,
                U.Fname AS CustomerFirstName,
                U.Lname AS CustomerLastName
             FROM Orders O
             JOIN Users U ON O.Userid = U.Userid
             JOIN Includes I ON O.Transactionid = I.Transactionid
             JOIN Seller S ON I.Productid = S.Productid
             WHERE S.Userid = ?
             GROUP BY O.Transactionid
             ORDER BY O.OrderDate DESC`,
            [req.user.userId]
        );

        res.status(200).json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error("Orders fetch error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
});

router.get('/products', authenticateToken, async (req, res) => {
    try {
        const [products] = await promisePool.query(
            `SELECT 
                P.Productid,
                P.Name, 
                P.Description,
                P.Category,
                P.image,
                S.StockQuantity, 
                S.Price AS Price,
                P.Shipping,
                S.SellerID
             FROM Seller S 
             JOIN Product P ON S.Productid = P.Productid 
             JOIN Users U ON S.Userid = U.Userid
             WHERE S.Userid = ?`,
            [req.user.userId]
        );

        if (!products.length) {
            return res.status(404).json({ 
                success: false, 
                message: "No products found for this seller" 
            });
        }

        res.status(200).json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error("Products fetch error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
});

router.get('/reviews', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const [products] = await promisePool.query(
            `SELECT Productid FROM Seller WHERE Userid = ?`,
            [userId]
        );
        
        if (!products.length) {
            return res.status(200).json({
                success: true,
                reviews: []
            });
        }

        const productIds = products.map(p => p.Productid);

        const [reviews] = await promisePool.query(
            `SELECT 
                R.Rating, 
                R.Comment, 
                DATE_FORMAT(R.ReviewDate, '%Y-%m-%d') AS ReviewDate,
                U.Username, 
                P.Name AS ProductName
             FROM Reviews R
             JOIN Users U ON R.Userid = U.Userid
             JOIN Seller S ON R.SellerID = S.SellerID
             JOIN Product P ON S.Productid = P.Productid
             WHERE S.Userid = ? AND S.Productid IN (?)
             ORDER BY R.ReviewDate DESC`,
            [userId, productIds]
        );

        res.status(200).json({
            success: true,
            reviews: reviews
        });

    } catch (error) {
        console.error("Reviews fetch error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load reviews",
            error: error.message
        });
    }
});

module.exports = router;
