const Users = require("../../models/Users");

function createPrivateRoomId(userId1, userId2) {
    const ids = [Number(userId1), Number(userId2)].sort((a, b) => a - b);
    return `private:${ids[0]}:${ids[1]}`;
}

module.exports = function personalChat(io, socket) {
    const currentUserId = Number(socket.userId);

    socket.on("join_room", async (data, callback = () => {}) => {
        console.log("JOIN_ROOM EVENT RECEIVED:", data);
        console.log("Authenticated socket user ID:", socket.userId);
        try {
            const recipientId = Number(data?.userId);

            if (!Number.isInteger(recipientId) || recipientId <= 0) {
                return callback({
                    success: false,
                    message: "A valid recipient user ID is required"
                });
            }

            if (recipientId === currentUserId) {
                return callback({
                    success: false,
                    message: "You cannot chat with yourself"
                });
            }

            const [currentUser, recipient] = await Promise.all([
                Users.findByPk(currentUserId),
                Users.findByPk(recipientId)
            ]);

            if (!currentUser || !recipient) {
                return callback({
                    success: false,
                    message: "User not found"
                });
            }

            const roomId = createPrivateRoomId(
                currentUser.id,
                recipient.id
            );

            // Leave any previously opened private conversation.
            for (const room of socket.rooms) {
                if (room.startsWith("private:")) {
                    await socket.leave(room);
                }
            }

            await socket.join(roomId);

            callback({
                success: true,
                roomId,
                recipient: {
                    id: recipient.id,
                    name: recipient.name,
                    email: recipient.email
                }
            });
        } catch (error) {
            console.error("join_room error:", error);

            callback({
                success: false,
                message: "Unable to open conversation"
            });
        }
    });
};
