require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/distributors", require("./routes/distributorRoutes"));
app.use("/api/distributor", require("./routes/distributorInventoryRoutes"));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Basic Route
app.get("/", (req, res) => {
    res.send("B2B Supply Chain Platform API Running");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
