module.exports = (socket, io) => {
    socket.on("join-name", (roomName) => {
        socket.join(roomName);
    })

    socket.on("new-message", ({message, roomName}) => {
        console.log(socket.id, socket, "said", message);

        io.emit("new-message", {socket: socket, message: message });
    })
}