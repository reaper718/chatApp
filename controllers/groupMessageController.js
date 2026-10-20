const GroupMessages = require("../models/GroupMessages");
const GroupMembers = require("../models/GroupMembers");
const Users = require("../models/Users");

const sendGroupMessage = async (req, res) => {
    try {
        const { groupId, message } = req.body;
        const userId = req.user.id;

        const parsedGroupId = Number(groupId);
        const text = typeof message === "string" ? message.trim() : "";

        if (
            !Number.isInteger(parsedGroupId) ||
            parsedGroupId <= 0 ||
            !text
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid group ID and message are required"
            });
        }

        // Verify the sender is a member of the group.
        const membership = await GroupMembers.findOne({
            where: {
                GroupId: parsedGroupId,
                UserId: userId
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // Save the message in the database.
        const savedMessage = await GroupMessages.create({
            message: text,
            GroupId: parsedGroupId,
            UserId: userId
        });

        // Include sender details in the real-time event.
        const sender = await Users.findByPk(userId, {
            attributes: ["id", "name"]
        });

        const messageData = {
            id: savedMessage.id,
            message: savedMessage.message,
            GroupId: savedMessage.GroupId,
            UserId: savedMessage.UserId,
            senderName: sender?.name || "Unknown",
            createdAt: savedMessage.createdAt
        };

        const io = req.app.get("io");

        if (io) {
            io.to(`group:${parsedGroupId}`).emit(
                "receive_group_message",
                messageData
            );
        }

        return res.status(201).json({
            success: true,
            data: messageData
        });
    } catch (error) {
        console.error("Send group message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send group message"
        });
    }
};

module.exports = { sendGroupMessage };
