const { Op } = require("sequelize");

const sequelize = require("../utils/db-connection");

const Messages = require("../models/messages");
const GroupMessages = require("../models/GroupMessages");

const ArchivedMessages = require("../models/ArchivedMessages");
const ArchivedGroupMessages = require("../models/ArchivedGroupMessages");

const BATCH_SIZE = 500;

async function archiveBatch(SourceModel, ArchiveModel, where) {
    const transaction = await sequelize.transaction();

    try {
        // Fetch a limited batch of old messages.
        const oldMessages = await SourceModel.findAll({
            where,
            attributes: [
                "id",
                "message",
                "UserId",
                ...(SourceModel === Messages ? ["to"] : ["GroupId"]),
                "mediaKey",
                "mediaName",
                "mediaType",
                "mediaSize",
                "createdAt",
                "updatedAt"
            ],
            order: [["createdAt", "ASC"], ["id", "ASC"]],
            limit: BATCH_SIZE,
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (oldMessages.length === 0) {
            await transaction.commit();
            return 0;
        }

        const now = new Date();

        // Convert active records into archive records.
        const archiveRows = oldMessages.map((record) => {
            const row = record.toJSON();

            return {
                originalMessageId: row.id,
                message: row.message,
                UserId: row.UserId,
                ...(SourceModel === Messages
                    ? { to: row.to }
                    : { GroupId: row.GroupId }),
                mediaKey: row.mediaKey,
                mediaName: row.mediaName,
                mediaType: row.mediaType,
                mediaSize: row.mediaSize,
                originalCreatedAt: row.createdAt,
                originalUpdatedAt: row.updatedAt,
                archivedAt: now,
                createdAt: now,
                updatedAt: now
            };
        });

        // Duplicate originalMessageId values are ignored on retries.
        await ArchiveModel.bulkCreate(archiveRows, {
            ignoreDuplicates: true,
            transaction
        });

        // Verify every selected message has an archive record.
        const originalIds = oldMessages.map((record) => record.id);

        const archivedRecords = await ArchiveModel.findAll({
            where: {
                originalMessageId: {
                    [Op.in]: originalIds
                }
            },
            attributes: ["originalMessageId"],
            transaction
        });

        const archivedIds = new Set(
            archivedRecords.map((record) => record.originalMessageId)
        );

        const allArchived = originalIds.every((id) =>
            archivedIds.has(id)
        );

        if (!allArchived) {
            throw new Error("Archive verification failed; batch rolled back");
        }

        // Delete only after all archive records are verified.
        await SourceModel.destroy({
            where: {
                id: {
                    [Op.in]: originalIds
                }
            },
            transaction
        });

        await transaction.commit();

        console.log(
            `Archived ${oldMessages.length} messages from ${SourceModel.name}`
        );

        return oldMessages.length;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function archiveOldMessages() {
    // Archive messages older than 24 hours.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log("Starting message archival. Cutoff:", cutoff);

    let personalCount = 0;
    let groupCount = 0;

    // Continue processing batches until no old messages remain.
    while (true) {
        const count = await archiveBatch(
            Messages,
            ArchivedMessages,
            { createdAt: { [Op.lt]: cutoff } }
        );

        personalCount += count;

        if (count === 0) break;
    }

    while (true) {
        const count = await archiveBatch(
            GroupMessages,
            ArchivedGroupMessages,
            { createdAt: { [Op.lt]: cutoff } }
        );

        groupCount += count;

        if (count === 0) break;
    }

    console.log("Message archival completed:", {
        personalCount,
        groupCount
    });

    return { personalCount, groupCount };
}

module.exports = { archiveOldMessages };
