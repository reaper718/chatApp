const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25 MB
    },
    fileFilter: (req, file, callback) => {
        callback(null, true);
    }
});

module.exports = upload;
