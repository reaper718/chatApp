const crypto = require("crypto");
const path = require("path");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const GroupMembers = require("../models/GroupMembers");
const GroupMessages = require("../models/GroupMessages");
const Messages = require("../models/messages");

const {PutObjectCommand} = require("@aws-sdk/client-s3");

const s3 = require("../utils/s3");

const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        const file = req.file;

        if (!ALLOWED_TYPES.has(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "This file type is not supported"
            });
        }

        const extension = path.extname(file.originalname)
            .toLowerCase()
            .replace(/[^a-z0-9.]/g, "");

        const key = `media/${crypto.randomUUID()}${extension}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                uploadedby: String(req.user.id)
            }
        }));

        return res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                key,
                originalName: path.basename(file.originalname),
                contentType: file.mimetype,
                size: file.size
            }
        });
    } catch (error) {
        console.error("Media upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to upload media"
        });
    }
};

const getMediaUrl = async (req, res) => {
    try {
        const key = req.query.key;
        const userId = Number(req.user.id);

        if (
            typeof key !== "string" ||
            !key.startsWith("media/") ||
            key.includes("..")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid media key"
            });
        }

        // Find a saved personal-chat media message.
        const personalMessage = await Messages.findOne({
            where: { mediaKey: key }
        });

        let authorized = false;

        if (personalMessage) {
            authorized =
                Number(personalMessage.UserId) === userId ||
                Number(personalMessage.to) === userId;
        } else {
            // Otherwise, check whether this belongs to a group message.
            const groupMessage = await GroupMessages.findOne({
                where: { mediaKey: key }
            });

            if (groupMessage) {
                const membership = await GroupMembers.findOne({
                    where: {
                        GroupId: groupMessage.GroupId,
                        UserId: userId
                    }
                });

                authorized = Boolean(membership);
            }
        }

        if (!authorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this media"
            });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        });

        const url = await getSignedUrl(s3, command, {
            expiresIn: 300
        });

        return res.json({
            success: true,
            data: { url, expiresIn: 300 }
        });
    } catch (error) {
        console.error("Get media URL error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate media URL"
        });
    }
};

module.exports = { 
    uploadMedia, 
    getMediaUrl 
};