const { Server } = require('socket.io');
const socketAuth  =require('./middelware');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000"
        }
    });

    socketAuth(io);

    io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    console.log("User connected:", socket.userId);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.userId);
    });
});
}

