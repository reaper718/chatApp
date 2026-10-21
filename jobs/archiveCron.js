const { CronJob } = require("cron");
const { archiveOldMessages } = require("../services/archiveMessages");

let isRunning = false;

const archiveJob = new CronJob(
    "0 0 2 * * *", // Every night at 2:00 AM
    async () => {
        if (isRunning) {
            console.log("Archival already running; skipping this run");
            return;
        }

        isRunning = true;

        try {
            await archiveOldMessages();
        } catch (error) {
            console.error("Nightly archival failed:", error);
        } finally {
            isRunning = false;
        }
    },
    null,
    false,
    "Asia/Kolkata"
);

module.exports = archiveJob;
