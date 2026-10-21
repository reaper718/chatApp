
const {
    HeadObjectCommand
} = require("@aws-sdk/client-s3");

const s3 = require("../utils/s3");
const Messages = require("../models/messages");
const GroupMessages = require("../models/GroupMessages");
const GroupMembers = require("../models/GroupMembers");
const Users = require("../models/Users");

const sendMediaMessage = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const {
            key,
            recipientId,
            groupId,
            caption
        } = req.body;

        const mediaKey = typeof key === "string" ? key : "";
        const text = typeof caption === "string" ? caption.trim() : "";

        // A media message must target exactly one conversation type.
        const personalChat = recipientId !== undefined && recipientId !== null;
        const groupChat = groupId !== undefined && groupId !== null;

        if (
            !mediaKey.startsWith("media/") ||
            mediaKey.includes("..") ||
            personalChat === groupChat
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid media key or conversation"
            });
        }

        // Confirm that the object exists and was uploaded by this user.
        const object = await s3.send(new HeadObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: mediaKey
        }));

        if (object.Metadata?.uploadedby !== String(userId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot share this uploaded file"
            });
        }

        const mediaName = mediaKey.split("/").pop();

        const mediaData = {
            mediaKey,
            mediaName,
            mediaType: object.ContentType || "application/octet-stream",
            mediaSize: object.ContentLength || 0
        };

        let savedMessage;
        let eventName;
        let room;

        if (personalChat) {
            const to = Number(recipientId);

            if (!Number.isInteger(to) || to <= 0 || to === userId) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid recipient"
                });
            }

            const recipient = await Users.findByPk(to);

            if (!recipient) {
                return res.status(404).json({
                    success: false,
                    message: "Recipient not found"
                });
            }

            savedMessage = await Messages.create({
                message: text || null,
                UserId: userId,
                to,
                ...mediaData
            });

            eventName = "receiveMessage";

            // Both users are already joined to their user-specific rooms.
            room = [`user:${userId}`, `user:${to}`];
        } else {
            const parsedGroupId = Number(groupId);

            if (
                !Number.isInteger(parsedGroupId) ||
                parsedGroupId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid group ID"
                });
            }

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

            savedMessage = await GroupMessages.create({
                message: text || null,
                GroupId: parsedGroupId,
                UserId: userId,
                ...mediaData
            });

            const sender = await Users.findByPk(userId, {
                attributes: ["id", "name"]
            });

            eventName = "receive_group_message";
            room = [`group:${parsedGroupId}`];

            const messageData = {
                ...savedMessage.toJSON(),
                senderName: sender?.name || "Unknown"
            };

            const io = req.app.get("io");

            if (io) {
                io.to(room[0]).emit(eventName, messageData);
            }

            return res.status(201).json({
                success: true,
                data: messageData
            });
        }

        const messageData = savedMessage.toJSON();
        const sender = await Users.findByPk(userId, {
            attributes: ["id", "name"]
        });

        messageData.senderName = sender?.name || "Unknown";

        const io = req.app.get("io");

        if (io) {
            io.to(room[0])
                .to(room[1] || room[0])
                .emit(eventName, messageData);
        }

        return res.status(201).json({
            success: true,
            data: messageData
        });
    } catch (error) {
        console.error("Send media message error:", error);

        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return res.status(404).json({
                success: false,
                message: "Uploaded file not found in S3"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to share media"
        });
    }
};

module.exports = { sendMediaMessage };
