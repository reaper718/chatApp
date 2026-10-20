const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const User = require('./models/Users');
const forgotPassword = require('./models/ForgotPasswordRequests');
const Messages = require('./models/messages');

const userRouter = require('./routers/userRouter');
const forgotPassedRouter = require('./routers/forgotPasswdRouter');
const messageRouter = require('./routers/messageRouter');
const { log } = require('console');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors());

app.set("io",io);

app.use('/users',userRouter);
app.use('/password',forgotPassedRouter);
app.use('/messages', messageRouter);

User.hasMany(forgotPassword);
forgotPassword.belongsTo(User);

User.hasMany(Messages);
Messages.belongsTo(User);

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

io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    console.log("User connected:", socket.userId);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.userId);
    });
});

db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})
