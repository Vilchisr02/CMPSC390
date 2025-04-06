// backend/auth.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import JWT
const router = express.Router();

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '----', // Replace with your MySQL password
    database: 'eCommerceDB', // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify the pool for async/await usage
const promisePool = pool.promise();

// Secret key for JWT (should be stored in environment variables in production)
const JWT_SECRET = 'your-secret-key';

// Sign-up route
router.post('/signup', async (req, res) => {
    const { firstName, lastName, phoneNumber, address, username, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the user already exists
        const [existingUser] = await promisePool.query(
            'SELECT * FROM Users WHERE Username = ? OR Email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const [result] = await promisePool.query(
            'INSERT INTO Users (Fname, Lname, PhoneNumber, Address, Username, Email, Password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, phoneNumber, address, username, email, hashedPassword]
        );

        // Fetch the newly created user data
        const [newUser] = await promisePool.query(
            'SELECT * FROM Users WHERE Userid = ?', [result.insertId]
        );

        // Exclude the password from the user data
        const { password: _, ...userData } = newUser[0];

        // Generate a JWT token
        const token = jwt.sign({ userId: userData.Userid, username: userData.Username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'User created successfully', user: userData, token });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Sign-in route
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Find the user in the database
        const [users] = await promisePool.query(
            'SELECT * FROM Users WHERE Username = ?', [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = users[0];

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.Password || user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Return user data (excluding password) upon successful login
        const { password: _, ...userData } = user;

        // Generate a JWT token
        const token = jwt.sign({ userId: user.Userid, username: user.Username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', user: userData, token });
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
