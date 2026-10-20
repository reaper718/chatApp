const Messages = require('../models/messages');

const sendMessage = async (req,res) => {
    try {

        const {message} = req.body;

        if(!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "data cannot be empty"
            })
        }

        const userId = req.user.id;

        const  newMessage = await Messages.create({
            message: message,
            UserId: userId
        })

        return res.status(201).json({
            success: true,
            message: "Message saed successfully!",
            data: newMessage
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error,
            message: "unable to deliever message"
        })
    }
}

const getAllMessages = async (req,res) => {
    try {
        const messages = await Messages.findAll();

        return res.status(200).json(messages);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error,
            message: "unable to get all messages"
        })
    }
}

module.exports = {
    sendMessage,
    getAllMessages
}