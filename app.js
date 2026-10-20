const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIO = require('./socket_io');

const User = require('./models/Users');
const forgotPassword = require('./models/ForgotPasswordRequests');
const Messages = require('./models/messages');

const userRouter = require('./routers/userRouter');
const forgotPassedRouter = require('./routers/forgotPasswdRouter');
const messageRouter = require('./routers/messageRouter');

const app = express();
const server = http.createServer(app);

socketIO(server);

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

User.hasMany(forgotPassword);
forgotPassword.belongsTo(User);

User.hasMany(Messages);
Messages.belongsTo(User);

db.sync()
    .then(() => {
        server.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch((err) => {
        console.log(err);
    });
