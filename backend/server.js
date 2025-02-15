const express = require('express');
const path = require('path');
const authRoutes = require('./auth'); // Import the auth routes

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

// Use the authentication routes
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

