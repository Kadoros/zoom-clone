const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");

const socket = new WebSocket(`ws://${window.location.host}`);

socket.onopen = () => {
  console.log("WebSocket connection established. ✔");
};

socket.onclose = () => {
  console.log("WebSocket connection closed. ❌");
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

socket.onmessage = (message) => {
  console.log("WebSocket message received:", message.data);
};

setTimeout(() => {
  socket.send("Hello, server!");
}, 1000);

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(input.value);
  input.value = "";
});
