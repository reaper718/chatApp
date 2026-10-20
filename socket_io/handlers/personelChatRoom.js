const Users = require("../../models/Users");
const Messages = require("../../models/messages");

function createPrivateRoomId(email1, email2) {
    const emails = [email1.trim().toLowerCase(), email2.trim().toLowerCase()]
        .sort();

    return `private:${emails[0]}:${emails[1]}`;
}

module.exports = function personalChat(io, socket) {
    const currentUserId = Number(socket.userId);

    socket.on("join_room", async (data, callback = () => {}) => {
        try {
            const recipientEmail = data?.email?.trim().toLowerCase();

            if (!recipientEmail) {
                return callback({ success: false, message: "Email is required" });
            }

            const recipient = await Users.findOne({
                where: { email: recipientEmail }
            });

            if (!recipient) {
                return callback({ success: false, message: "User not found" });
            }

            if (Number(recipient.id) === currentUserId) {
                return callback({
                    success: false,
                    message: "You cannot start a chat with yourself"
                });
            }

            const currentUser = await Users.findByPk(currentUserId);

            if (!currentUser) {
                return callback({ success: false, message: "Invalid user" });
            }

            const roomId = createPrivateRoomId(
                currentUser.email,
                recipient.email
            );

            // Leave previous private-chat rooms.
            for (const room of socket.rooms) {
                if (room.startsWith("private:")) {
                    socket.leave(room);
                }
            }

            socket.join(roomId);

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
            callback({ success: false, message: "Unable to join chat" });
        }
    });

    socket.on("new_message", async (data, callback = () => {}) => {
        try {
            const { roomId, message } = data || {};

            if (
                typeof roomId !== "string" ||
                !roomId.startsWith("private:") ||
                typeof message !== "string" ||
                !message.trim()
            ) {
                return callback({ success: false, message: "Invalid message" });
            }

            // The sender must already have joined this room.
            if (!socket.rooms.has(roomId)) {
                return callback({ success: false, message: "Join the chat first" });
            }

            // Confirm that the room represents the sender and a real recipient.
            const currentUser = await Users.findByPk(currentUserId);
            if (!currentUser) {
                return callback({ success: false, message: "Invalid user" });
            }

            const prefix = "private:";
            const roomEmails = roomId.slice(prefix.length).split(":");

            if (
                roomEmails.length !== 2 ||
                !roomEmails.includes(currentUser.email.toLowerCase())
            ) {
                return callback({ success: false, message: "Invalid room" });
            }

            const recipientEmail = roomEmails.find(
                email => email !== currentUser.email.toLowerCase()
            );

            const recipient = await Users.findOne({
                where: { email: recipientEmail }
            });

            if (!recipient) {
                return callback({ success: false, message: "Recipient not found" });
            }

            // Persist before emitting. Adapt fields to your actual model.
            const savedMessage = await Messages.create({
                message: message.trim(),
                to: String(recipient.id),
                UserId: currentUserId
            });

            const payload = {
                id: savedMessage.id,
                message: savedMessage.message,
                from: currentUserId,
                to: recipient.id,
                roomId,
                createdAt: savedMessage.createdAt
            };

            io.to(roomId).emit("new_message", payload);

            callback({ success: true, data: payload });
        } catch (error) {
            console.error("new_message error:", error);
            callback({ success: false, message: "Unable to send message" });
        }
    });
};