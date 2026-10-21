
const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const GroupMessages = sequelize.define("GroupMessages", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    GroupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mediaKey: {
        type: DataTypes.STRING(1024),
        allowNull: true
    },
    mediaName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mediaType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mediaSize: {
        type: DataTypes.BIGINT,
        allowNull: true
    }
});

module.exports = GroupMessages;
