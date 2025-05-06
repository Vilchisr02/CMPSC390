const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Password',
    database: 'eCommerceDB'
});
const promisePool = pool.promise();

const JWT_SECRET = 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        req.user = user;
        next();
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/feedback')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    const { username, email, rating, comment } = req.body;
    const userId = req.user?.userId;
    const imageFileName = req.file ? `/uploads/feedback/${req.file.filename}` : null;


    if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
    }

    let userEmail = email;
    let userName = username;
    
    if (userId) {
        try {
            const [user] = await promisePool.query(
                'SELECT Email, CONCAT(Fname, " ", Lname) AS fullName FROM Users WHERE Userid = ?',
                [userId]
            );
            
            if (user.length > 0) {
                userEmail = user[0].Email;
                userName = user[0].fullName;
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            return res.status(500).json({ message: 'Error fetching user details' });
        }
    } else {

        if (!email || !username) {
            return res.status(400).json({ message: 'Name and email are required for guests' });
        }
    }

    try {
        await promisePool.query(
            'INSERT INTO Feedback (Userid, Username, Email, Rating, Comment, Image_path) VALUES (?, ?, ?, ?, ?, ?)',
            [userId || null, userName, userEmail, rating, comment, imageFileName]
        );

        res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [feedbacks] = await promisePool.query(`
            SELECT 
                FeedbackID, 
                Username, 
                Email, 
                Rating, 
                Comment, 
                Image_path, 
                created_at,
                CASE 
                    WHEN Userid IS NOT NULL THEN 'verified'
                    ELSE 'guest'
                END AS userType
            FROM Feedback
            ORDER BY created_at DESC
            LIMIT 50
        `);
        
        res.status(200).json({ success: true, feedbacks });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
