const API_URL = "http://localhost:3000";

let currentRoomId = null;

function getCurrentUserId() {
    const token = sessionStorage.getItem("token");

    if (!token) return null;

    try {
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        return Number(payload.id);
    } catch (error) {
        console.error("Unable to decode user ID from token:", error);
        return null;
    }
}

let currentUserId = getCurrentUserId();

let socket;
let currentChatUser = null;

const groupsList = document.getElementById("groupsList");
const createGroupBtn = document.getElementById("createGroupBtn");

let currentChatType = "personal";
let currentGroup = null;

let allUsers = [];

const contactsList = document.getElementById("contactsList");
const searchContacts = document.getElementById("searchContacts");

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const createGroupModal = document.getElementById("createGroupModal");
const createGroupForm = document.getElementById("createGroupForm");
const groupNameInput = document.getElementById("groupName");
const groupMembersList = document.getElementById("groupMembersList");
const cancelGroupBtn = document.getElementById("cancelGroupBtn");


function addMessage(text, time, isSent = true, senderName = "") {
    const messageDiv = document.createElement("div");

    messageDiv.classList.add(
        "message",
        isSent ? "sent" : "received"
    );

    // Show the sender's name for received group messages.
    if (!isSent && currentChatType === "group" && senderName) {
        const sender = document.createElement("div");
        sender.className = "message-sender";
        sender.textContent = senderName;
        messageDiv.appendChild(sender);
    }

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = text;

    const timeElement = document.createElement("div");
    timeElement.className = "message-time";

    const date = time ? new Date(time) : new Date();

    timeElement.textContent = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    messageDiv.append(messageText, timeElement);
    messages.appendChild(messageDiv);

    messages.scrollTop = messages.scrollHeight;
}


messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    const token = sessionStorage.getItem("token");

    try {
        if (currentChatType === "group" && currentGroup) {
            await axios.post(
                `${API_URL}/group-messages/send`,
                {
                    groupId: currentGroup.id,
                    message: text
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } else if (currentChatType === "personal" && currentChatUser) {
            await axios.post(
                `${API_URL}/messages/send`,
                {
                    to: currentChatUser.id,
                    message: text
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } else {
            return;
        }

        messageInput.value = "";
    } catch (error) {
        console.error("Send message error:", error.response?.data || error);
        alert(error.response?.data?.message || "Unable to send message");
    }
});


function initialize() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Please log in first.");
        window.location.href = "/login.html";
        return;
    }

    socket = io(API_URL, {
        auth: { token }
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.IO:", socket.id);
    });

    socket.on("connect_error", error => {
        console.error("Socket connection error:", error.message);
    });

    loadUsers();
    loadGroups();

    socket.on("receiveMessage", data => {
        if (!currentChatUser) return;

        const senderId = Number(data.UserId);
        const recipientId = Number(data.to);
        const selectedId = Number(currentChatUser.id);

        // Display only messages belonging to the currently open conversation.
        const belongsToCurrentChat =
            (senderId === selectedId || recipientId === selectedId);

        if (!belongsToCurrentChat) return;

        const isSent = senderId !== selectedId;

        addMessage(data.message, data.createdAt, isSent);
    });

    
    socket.on("receive_group_message", (data) => {
        console.log("Group message received:", data);

        if (
            currentChatType === "group" &&
            currentGroup &&
            Number(data.GroupId) === Number(currentGroup.id)
        ) {
            console.log("Message sender ID:", data.UserId);
            console.log("Logged-in user ID:", currentUserId);

            const isSent = Number(data.UserId) === Number(currentUserId);

            console.log("Is my message:", isSent);

            addMessage(
                data.message,
                data.createdAt,
                isSent,
                data.senderName
            );
        }
    });

}

async function loadUsers() {
    try {
        const token = sessionStorage.getItem("token");

        const response = await axios.get(
            `${API_URL}/users/getAllUsers`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // console.log("Users response:", response.data);

        // Adjust this line if your API returns a different structure.
        const users = Array.isArray(response.data)
            ? response.data
            : response.data.users || response.data.data;

        if (!Array.isArray(users)) {
            console.error("Unexpected users API response:", response.data);
            return;
        }

        allUsers = users;
        displayUsers(users);
    } catch (error) {
        console.error(
            "Failed to load users:",
            error.response?.data || error.message
        );
    }
}


async function loadGroups() {
    try {
        const token = sessionStorage.getItem("token");

        const response = await axios.get(
            `${API_URL}/groups/my-groups`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const groups = response.data.data;

        groupsList.replaceChildren();

        groups.forEach(group => {
            const item = document.createElement("div");
            item.className = "group-contact";
            item.dataset.groupId = group.id;

            const avatar = document.createElement("div");
            avatar.className = "group-avatar";
            avatar.textContent = group.name.charAt(0).toUpperCase();

            const name = document.createElement("span");
            name.textContent = group.name;

            item.append(avatar, name);

            item.addEventListener("click", () => {
                document.querySelectorAll(
                    "#contactsList .contact, #groupsList .group-contact"
                ).forEach(element => element.classList.remove("active"));

                item.classList.add("active");

                currentChatType = "group";
                currentGroup = group;
                currentChatUser = null;

                openGroupChat(group);
            });

            groupsList.appendChild(item);
        });

        console.log("Groups loaded:", groups.length);
    } catch (error) {
        console.error(
            "Failed to load groups:",
            error.response?.data || error.message
        );
    }
}

createGroupBtn.addEventListener("click", () => {
    groupNameInput.value = "";
    groupMembersList.replaceChildren();

    // Reuse the contacts already loaded by your existing API.
    if (!Array.isArray(allUsers) || allUsers.length === 0) {
        alert("No contacts available.");
        return;
    }

    allUsers.forEach((user) => {
        const label = document.createElement("label");
        label.className = "group-member-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = user.id;

        const name = document.createElement("span");
        name.textContent = user.name;

        label.append(checkbox, name);
        groupMembersList.appendChild(label);
    });

    createGroupModal.classList.remove("hidden");
});

cancelGroupBtn.addEventListener("click", () => {
    createGroupModal.classList.add("hidden");
});

createGroupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = groupNameInput.value.trim();

    const memberIds = Array.from(
        groupMembersList.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    ).map((checkbox) => Number(checkbox.value));

    if (!name) {
        alert("Please enter a group name.");
        return;
    }

    const token = sessionStorage.getItem("token");

    try {
        const response = await axios.post(
            `${API_URL}/groups/create`,
            {
                name,
                memberIds
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            createGroupModal.classList.add("hidden");
            createGroupForm.reset();

            await loadGroups();

            alert("Group created successfully!");
        } else {
            alert(response.data.message || "Unable to create group.");
        }
    } catch (error) {
        console.error(
            "Create group error:",
            error.response?.data || error
        );

        alert(
            error.response?.data?.message ||
            "Unable to create group. Please try again."
        );
    }
});


function displayUsers(users) {
    const contactsList = document.getElementById("contactsList");

    if (!contactsList) {
        console.error("Element #contactsList not found");
        return;
    }

    contactsList.innerHTML = "";

    users.forEach(user => {
        // console.log("Displaying user:", user.name);

        const contact = document.createElement("div");
        contact.classList.add("contact");
        contact.dataset.userId = user.id;

        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.textContent = (user.name || user.email || "?")
            .charAt(0).toUpperCase();

        const info = document.createElement("div");
        info.classList.add("contact-info");

        const name = document.createElement("h3");
        name.textContent = user.name || "Unknown user";

        const email = document.createElement("p");
        email.textContent = user.email || "";

        info.appendChild(name);
        info.appendChild(email);

        contact.appendChild(avatar);
        contact.appendChild(info);

        contact.addEventListener("click", () => {
            console.log("contact clicked")
            document.querySelectorAll("#contactsList .contact")
                .forEach(item => item.classList.remove("active"));

            contact.classList.add("active");

            currentChatUser = user;
            openChat(user);
        });

        contactsList.appendChild(contact);
    });
}

async function openChat(user) {
    const chatName = document.getElementById("chatName");
    const chatAvatar = document.getElementById("chatAvatar");
    const chatStatus = document.getElementById("chatStatus");
    const sendButton = messageForm.querySelector("button");

    currentChatUser = user;
    currentRoomId = null;

    chatName.textContent = user.name || user.email;
    chatAvatar.textContent =
        (user.name || user.email || "?").charAt(0).toUpperCase();

    chatStatus.textContent = "Opening conversation...";
    messages.replaceChildren();

    messageInput.disabled = true;
    sendButton.disabled = true;

    if (!socket?.connected) {
        chatStatus.textContent = "Chat server is disconnected.";
        return;
    }

    socket.emit("join_room", { userId: user.id }, response => {
        console.log("join_room response:", response);

        if (!response?.success) {
            chatStatus.textContent =
                response?.message || "Unable to open conversation";
            return;
        }

        currentRoomId = response.roomId;
        chatStatus.textContent = "Connected";

        // Enable the message composer.
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();

        console.log("Conversation ready:", currentRoomId);
    });
}

function openGroupChat(group) {
    currentChatType = "group";
    currentGroup = group;
    currentChatUser = null;
    currentRoomId = null;

    document.getElementById("chatName").textContent = group.name;
    document.getElementById("chatAvatar").textContent =
        group.name.charAt(0).toUpperCase();

    document.getElementById("chatStatus").textContent = "Group chat";

    messages.replaceChildren();

    messageInput.disabled = true;
    messageForm.querySelector("button").disabled = true;

    socket.emit("join_group", { groupId: group.id }, (response) => {
        if (!response?.success) {
            alert(response?.message || "Unable to join group");
            return;
        }

        messageInput.disabled = false;
        messageForm.querySelector("button").disabled = false;

        console.log("Joined group:", response.group.name);
    });
}

searchContacts.addEventListener("input", () => {
    const query = searchContacts.value.toLowerCase();

    document.querySelectorAll("#contactsList .contact").forEach(contact => {
        contact.hidden = !contact.textContent.toLowerCase().includes(query);
    });
});

document.addEventListener("DOMContentLoaded", initialize);

function getPrivateRoomId(userId1, userId2) {
    const ids = [Number(userId1), Number(userId2)].sort((a, b) => a - b);
    return `private:${ids[0]}:${ids[1]}`;
}