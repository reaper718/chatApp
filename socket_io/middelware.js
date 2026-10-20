const jwt = require('jsonwebtoken');

module.exports = (io) => {
    io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, 'secretKey');

        // Match this property to the ID field in your JWT payload.
        socket.userId = decoded.id;

        if (!socket.userId) {
            return next(new Error("Invalid user token"));
        }

        next();
    } catch (error) {
        next(new Error("Invalid authentication token"));
    }
});
}