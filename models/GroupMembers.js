
const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const GroupMembers = sequelize.define("GroupMembers", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ["GroupId", "UserId"]
        }
    ]
});

module.exports = GroupMembers;
