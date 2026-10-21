require("dotenv").config();

const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIO = require('./socket_io');

const archiveJob = require("./jobs/archiveCron");

const User = require('./models/Users');
const forgotPassword = require('./models/ForgotPasswordRequests');
const Messages = require('./models/messages');
const Groups = require("./models/Groups");
const GroupMembers = require("./models/GroupMembers");
const GroupMessages = require("./models/GroupMessages");
const ArchivedMessages = require("./models/ArchivedMessages");
const ArchivedGroupMessages = require("./models/ArchivedGroupMessages");

const userRouter = require('./routers/userRouter');
const forgotPassedRouter = require('./routers/forgotPasswdRouter');
const messageRouter = require('./routers/messageRouter');
const groupRouter = require('./routers/groupRouter');
const groupMessageRouter = require('./routers/groupMessageRouter');
const mediaRouter = require("./routers/mediaRouter");
const mediaMessageRouter = require("./routers/mediaMessageRouter");

const app = express();
const server = http.createServer(app);

const io = socketIO(server);

app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, "./public/login.html"))
})

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors());

app.set("io",io);

app.use('/users',userRouter);
app.use('/password',forgotPassedRouter);
app.use('/messages', messageRouter);
app.use('/groups',groupRouter);
app.use('/group-Messages', groupMessageRouter);
app.use('/media',mediaRouter);
app.use("/media-messages", mediaMessageRouter);

User.hasMany(forgotPassword);
forgotPassword.belongsTo(User);

User.hasMany(Messages);
Messages.belongsTo(User);

// A user can create multiple groups.
User.hasMany(Groups, {
    foreignKey: "createdBy"
});

Groups.belongsTo(User, {
    foreignKey: "createdBy"
});

// Groups can have many members.
Groups.belongsToMany(User, {
    through: GroupMembers,
    foreignKey: "GroupId",
    otherKey: "UserId"
});

User.belongsToMany(Groups, {
    through: GroupMembers,
    foreignKey: "UserId",
    otherKey: "GroupId"
});

GroupMembers.belongsTo(Groups, {
    foreignKey: "GroupId"
});

Groups.hasMany(GroupMembers, {
    foreignKey: "GroupId"
});

GroupMembers.belongsTo(User, {
    foreignKey: "UserId"
});

User.hasMany(GroupMembers, {
    foreignKey: "UserId"
});

Groups.hasMany(GroupMessages, {
    foreignKey: "GroupId"
});

GroupMessages.belongsTo(Groups, {
    foreignKey: "GroupId"
});

User.hasMany(GroupMessages, {
    foreignKey: "UserId"
});

GroupMessages.belongsTo(User, {
    foreignKey: "UserId"
});

await db.sync()
    .then(() => {
        server.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch((err) => {
        console.log(err);
    });


archiveJob.start();