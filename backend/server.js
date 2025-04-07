const express = require('express');
const path = require('path');
const authRoutes = require('./auth');
const paymentRoutes = require('./payment');
const listingRoutes = require('./listing');
const orderRoutes = require('./order');
const session = require('express-session');



const app = express();
const PORT = 3000;

app.use(session({
    secret: 'your-secret-key', // use something secure in real apps
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));



app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/listing', listingRoutes);
app.use('/', require('./order'));


app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

