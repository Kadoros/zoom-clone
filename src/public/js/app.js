const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message-form");
const nicknameForm = document.querySelector("#nickname-form");

const socket = new WebSocket(`ws://${window.location.host}`);

function makeMassage(type, payload) {
  const message = { type, payload };
  return JSON.stringify(message);
}
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
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMassage("msg", input.value));
  input.value = "";
});

nicknameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = nicknameForm.querySelector("input");
  socket.send(makeMassage("nickname", input.value));
  input.value = "";
});
