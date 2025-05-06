const express = require('express');
const path = require('path');
const authRoutes = require('./auth');
const paymentRoutes = require('./payment');
const listingRoutes = require('./listing');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const feedbackRoutes = require('./feedback');
const reviewsRoutes = require('./reviews');
const unlockRoutes = require('./unlock');
const sellerRoutes = require('./seller');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/listing', listingRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/unlock', unlockRoutes);
app.use('/seller', sellerRoutes);

app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
