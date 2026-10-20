console.log("script.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");

    const button = document.getElementById("joinChatBtn");

    console.log("Start Chat button found:", button);

    if (button) {
        button.addEventListener("click", () => {
            console.log("START CHAT BUTTON CLICKED");
        });
    }
});

const API_URL = "http://localhost:3000";

let socket;
let currentRoomId = null;

const joinChatBtn = document.getElementById("joinChatBtn");
const recipientEmailInput = document.getElementById("recipientEmail");
const chatStatus = document.getElementById("chatStatus");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

function addMessage(text, time, isSent) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${isSent ? "sent" : "received"}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.appendChild(document.createTextNode(text));

    const timestamp = document.createElement("span");
    timestamp.className = "timestamp";
    timestamp.textContent = time
        ? new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
        : "";

    bubble.appendChild(timestamp);
    messageEl.appendChild(bubble);
    messages.appendChild(messageEl);
    messages.scrollTop = messages.scrollHeight;
}

function initialize() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Please log in first.");
        return;
    }

    socket = io(API_URL, {
        auth: { token }
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.IO:", socket.id);
    });

    socket.on("connect_error", error => {
        console.error("Socket connection failed:", error.message);
    });

    socket.on("new_message", data => {
        if (data.roomId !== currentRoomId) return;

        // Do not display the sender's own event twice.
        if (Number(data.from) === Number(sessionStorage.getItem("userId"))) {
            return;
        }

        addMessage(data.message, data.createdAt, false);
    });
}

joinChatBtn.addEventListener("click", () => {
    const email = recipientEmailInput.value.trim().toLowerCase();

    console.log("Start chat clicked");
    console.log("Recipient email:", email);
    console.log("Socket connected:", socket?.connected);

    if (!email) {
        chatStatus.textContent = "Please enter an email.";
        return;
    }

    if (!socket?.connected) {
        chatStatus.textContent = "Socket is not connected.";
        return;
    }

    chatStatus.textContent = "Joining chat...";

    socket.emit("join_room", { email }, (response) => {
        console.log("join_room response:", response);

        if (!response?.success) {
            currentRoomId = null;
            chatStatus.textContent =
                response?.message || "Failed to join chat.";
            return;
        }

        currentRoomId = response.roomId;

        chatStatus.textContent =
            `Chat connected with ${response.recipient.name}`;

        messages.replaceChildren();
        messageInput.disabled = false;

        console.log("Current room ID:", currentRoomId);
    });
});

messageForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    if (!currentRoomId) {
        chatStatus.textContent = "Start a chat before sending a message.";
        return;
    }

    socket.emit("new_message", {
        roomId: currentRoomId,
        message: text
    }, response => {
        if (!response?.success) {
            chatStatus.textContent =
                response?.message || "Unable to send message.";
            return;
        }

        const data = response.data;
        addMessage(data.message, data.createdAt, true);
        messageInput.value = "";
        messageInput.focus();
    });
});

document.addEventListener("DOMContentLoaded", initialize);