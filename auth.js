const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to parse JSON bodies
router.use(bodyParser.json());

router.get('/user', (req, res) => {
    const user = {
        Fname: "John",
        Lname: "Doe",
        Username: "jDoe01",
        Email: "johndoe@example.com",
        Address: "1234 Elm Street, Springfield, IL 62701",
        PhoneNumber: "1234567890"
    };
    res.json(user);
});
// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'password!', // Replace with your MySQL password
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

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const [result] = await promisePool.query(
            'INSERT INTO Users (Fname, Lname, PhoneNumber, Address, Username, Email, Password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, phoneNumber, address, username, email, hashedPassword]
        );

        // Fetch the newly created user data
        const [newUser] = await promisePool.query(
            'SELECT Userid, Fname, Lname, Username, Email FROM Users WHERE Userid = ?', [result.insertId]
        );

        if (newUser.length === 0) {
            return res.status(500).json({ message: 'User creation failed' });
        }

        const userData = newUser[0];

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
        const isPasswordValid = await bcrypt.compare(password, user.Password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Exclude password from response
        const { Password, ...userData } = user;

        // Generate a JWT token
        const token = jwt.sign({ userId: user.Userid, username: user.Username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', user: userData, token });
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

   
