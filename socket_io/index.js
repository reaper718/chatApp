const { Server } = require('socket.io');
const socketAuth  = require('./middelware');
const personelChatRoom = require('./handlers/personelChatRoom');
const groupChatRoom = require("./handlers/groupChatRoom");

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
    
    personelChatRoom(io,socket);
    groupChatRoom(io,socket);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.userId);
    });
});

return io;
}

