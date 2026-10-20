const Message = require("../models/messages");
const Users = require("../models/Users");

const sendMessage = async (req, res) => {
    try {
        const { message, to } = req.body;
        const from = req.user.id;

        if (!message || !message.trim() || !to) {
            return res.status(400).json({
                message: "Message and recipient are required"
            });
        }

        if (Number(to) === Number(from)) {
            return res.status(400).json({
                message: "Cannot send a message to yourself"
            });
        }

        const recipient = await Users.findByPk(to);

        if (!recipient) {
            return res.status(404).json({
                message: "Recipient not found"
            });
        }

        const newMessage = await Message.create({
            message: message.trim(),
            UserId: req.user.id,
            to: Number(to)
        });

        const io = req.app.get("io");

        console.log("Saved message:", {
            id: newMessage.id,
            from: newMessage.UserId,
            to: newMessage.to
        });

        console.log("Socket.IO available:", !!io);

        if (io) {
            console.log("Emitting receiveMessage to:", [
                `user:${newMessage.UserId}`,
                `user:${newMessage.to}`
            ]);

            io.to(`user:${newMessage.UserId}`)
                .to(`user:${newMessage.to}`)
                .emit("receiveMessage", newMessage.toJSON());
        }

        return res.status(201).json({
            message: "Message saved successfully",
            data: newMessage
        });
    } catch (error) {
        console.error("Error sending message:", error);

        return res.status(500).json({
            message: "Failed to send message"
        });
    }
};

module.exports = {
    sendMessage
}