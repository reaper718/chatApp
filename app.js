const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const User = require('./models/Users');
const forgotPassword = require('./models/ForgotPasswordRequests');

const userRouter = require('./routers/userRouter');
const forgotPassedRouter = require('./routers/forgotPasswdRouter');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors());


app.use('/users',userRouter);
app.use('/password',forgotPassedRouter)

User.hasMany(forgotPassword);
forgotPassword.belongsTo(User);

db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})

