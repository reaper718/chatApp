const Groups = require("../models/Groups");
const GroupMembers = require("../models/GroupMembers");
const Users = require("../models/Users");
const { Op } = require("sequelize");

const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const creatorId = Number(req.user.id);

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        if (!Array.isArray(memberIds)) {
            return res.status(400).json({
                message: "memberIds must be an array"
            });
        }

        // Normalize IDs and remove duplicates.
        const selectedIds = [
            ...new Set(
                memberIds
                    .map(Number)
                    .filter(id => Number.isInteger(id) && id > 0)
            )
        ].filter(id => id !== creatorId);

        // Validate that every requested member exists.
        const users = await Users.findAll({
            where: {
                id: { [Op.in]: selectedIds }
            },
            attributes: ["id"]
        });

        if (users.length !== selectedIds.length) {
            return res.status(400).json({
                message: "One or more selected users do not exist"
            });
        }

        // Create the group.
        const group = await Groups.create({
            name: name.trim(),
            createdBy: creatorId
        });

        // Add creator as admin and selected users as members.
        await GroupMembers.bulkCreate([
            {
                GroupId: group.id,
                UserId: creatorId,
                role: "admin"
            },
            ...selectedIds.map(userId => ({
                GroupId: group.id,
                UserId: userId,
                role: "member"
            }))
        ]);

        return res.status(201).json({
            message: "Group created successfully",
            data: {
                id: group.id,
                name: group.name,
                createdBy: group.createdBy,
                members: [creatorId, ...selectedIds]
            }
        });
    } catch (error) {
        console.error("Create group error:", error);

        return res.status(500).json({
            message: "Unable to create group"
        });
    }
};


const getMyGroups = async (req, res) => {
    try {
        const userId = Number(req.user.id);

        const memberships = await GroupMembers.findAll({
            where: { UserId: userId },
            attributes: ["GroupId", "role"],
            include: [
                {
                    model: Groups,
                    attributes: ["id", "name", "createdBy", "createdAt"]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        const groups = memberships
            .filter(membership => membership.Group)
            .map(membership => ({
                id: membership.Group.id,
                name: membership.Group.name,
                createdBy: membership.Group.createdBy,
                role: membership.role,
                createdAt: membership.Group.createdAt
            }));

        return res.status(200).json({
            message: "Groups fetched successfully",
            data: groups
        });
    } catch (error) {
        console.error("Get my groups error:", error);

        return res.status(500).json({
            message: "Unable to fetch groups"
        });
    }
};


module.exports = { 
    createGroup,
    getMyGroups 
};
