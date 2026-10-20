const GroupMembers = require("../../models/GroupMembers");
const Groups = require("../../models/Groups");

module.exports = function groupChatRoom(io, socket) {
    const currentUserId = Number(socket.userId);

    socket.on("join_group", async (data, callback = () => {}) => {
        console.log("JOIN_GROUP EVENT RECEIVED:", data);
        console.log("Authenticated user ID:", socket.userId);
        try {
            const groupId = Number(data?.groupId);

            if (!Number.isInteger(groupId) || groupId <= 0) {
                return callback({
                    success: false,
                    message: "Invalid group ID"
                });
            }

            // Verify that the group exists.
            const group = await Groups.findByPk(groupId);

            if (!group) {
                return callback({
                    success: false,
                    message: "Group not found"
                });
            }

            // Verify that the logged-in user belongs to this group.
            const membership = await GroupMembers.findOne({
                where: {
                    GroupId: groupId,
                    UserId: currentUserId
                }
            });

            if (!membership) {
                return callback({
                    success: false,
                    message: "You are not a member of this group"
                });
            }

            // Leave any previously joined group rooms.
            for (const room of socket.rooms) {
                if (room.startsWith("group:")) {
                    await socket.leave(room);
                }
            }

            const roomId = `group:${groupId}`;

            await socket.join(roomId);

            console.log(`User ${currentUserId} joined group room ${roomId}`);
            console.log("Sending join_group acknowledgement");

            callback({
                success: true,
                roomId,
                group: {
                    id: group.id,
                    name: group.name
                }
            });
        } catch (error) {
            console.error("Join group error:", error);

            callback({
                success: false,
                message: "Unable to join group"
            });
        }
    });
};
