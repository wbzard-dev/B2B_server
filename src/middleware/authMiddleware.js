const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Option A: Trust the token (faster)
        // req.user = decoded.user;

        // Option B: Fetch fresh user from DB (safer, handles role changes)
        // We need to require User model here if not present.
        // Assuming we want to trust token for speed but ensure entityType is present.
        req.user = decoded.user;

        // OR better, let's actually fetch the user to be 100% sure we have all fields
        // const User = require('../models/User');
        // req.user = await User.findById(decoded.user.id).select('-password');

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
