const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const API_URL = "http://localhost:3000";

function addMessage(text, time) {
    const message = document.createElement("div");
    message.classList.add("message", "sent");

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    bubble.appendChild(document.createTextNode(text));

    const timestamp = document.createElement("span");
    timestamp.classList.add("timestamp");
    timestamp.textContent = new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    bubble.appendChild(timestamp);
    message.appendChild(bubble);
    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}

messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    const token = sessionStorage.getItem("token");

    if (!token) {
        alert("Please log in first.");
        return;
    }

    const sendButton = messageForm.querySelector("button");
    sendButton.disabled = true;

    try {
        const response = await axios.post(
            `${API_URL}/messages/send`,
            { message: text },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // Display the message returned by the backend.
        addMessage(
            response.data.data.message,
            response.data.data.createdAt
        );

        messageInput.value = "";
        messageInput.focus();

    } catch (error) {
        console.error(error);

        alert(
            error.response?.data?.message ||
            "Unable to send message."
        );
    } finally {
        sendButton.disabled = false;
    }
});


function initialize() {
    const token = sessionStorage.getItem("token");

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    axios.get(`${API_URL}/users/getAllUsers`)
        .then((res) => {
            display(res.data);
        })
        .catch((err) => {
            console.log(err);
        });

    axios.get(`${API_URL}/messages/getAllMessages`)
        .then((res) => {
            // displayMessages(res.data);
            console.log(res.data);
        })
        .catch(err => console.log(err));
}

document.addEventListener("DOMContentLoaded", initialize);

function display(users) {
    const sidebar = document.querySelector(".sidebar");

    users.forEach((user, index) => {
        // Create contact container
        const contact = document.createElement("div");
        contact.classList.add("contact");

        if (index === 0) {
            contact.classList.add("active");
        }

        // Create avatar
        const avatar = document.createElement("div");
        avatar.classList.add("avatar");
        avatar.textContent = user.name.charAt(0).toUpperCase();

        // Create contact information
        const contactInfo = document.createElement("div");
        contactInfo.classList.add("contact-info");

        const name = document.createElement("h3");
        name.textContent = user.name;

        contactInfo.appendChild(name);

        // Append elements to contact
        contact.appendChild(avatar);
        contact.appendChild(contactInfo);

        // Add contact to sidebar
        sidebar.appendChild(contact);
    });
}