const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import JWT
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

router.post('/signup', async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [existingUser] = await promisePool.query(
            'SELECT * FROM Users WHERE Username = ? OR Email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await promisePool.query(
            'INSERT INTO Users (Fname, Lname, Username, Email, Password) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, username, email, hashedPassword]
        );

        const [newUser] = await promisePool.query(
            'SELECT * FROM Users WHERE Userid = ?', [result.insertId]
        );

        const { password: _, ...userData } = newUser[0];

        const token = jwt.sign({ userId: userData.Userid, username: userData.Username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'User created successfully', user: userData, token });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const [users] = await promisePool.query(
            'SELECT * FROM Users WHERE Username = ?', [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(password, user.Password || user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const { password: _, ...userData } = user;

        const token = jwt.sign({ userId: user.Userid, username: user.Username }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', user: userData, token });
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/user', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [users] = await promisePool.query(
            'SELECT Userid, Fname, Lname, Username, Email, PhoneNumber, Address FROM Users WHERE Userid = ?', 
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user: users[0] });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/user/update', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { phone, address } = req.body;
    
    if (!token) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        await promisePool.query(
            'UPDATE Users SET PhoneNumber = ?, Address = ? WHERE Userid = ?',
            [phone, address, decoded.userId]
        );

        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
