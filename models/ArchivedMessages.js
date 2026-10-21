
const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const ArchivedMessages = sequelize.define("ArchivedMessages", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    originalMessageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    to: {
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
    },
    originalCreatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    originalUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    archivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: "ArchivedMessages",
    timestamps: true,
    indexes: [
        { fields: ["UserId", "to", "originalCreatedAt"] },
        { fields: ["originalCreatedAt"] }
    ]
});

module.exports = ArchivedMessages;
