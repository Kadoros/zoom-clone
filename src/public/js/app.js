const socket = io();
const nameDiv = document.querySelector("#name");
const nicknameForm = nameDiv.querySelector("form");
const joinRoomDiv = document.querySelector("#join-room");
const joinForm = joinRoomDiv.querySelector("form");
const roomDiv = document.querySelector("#room");
const messageForm = roomDiv.querySelector("form");
const h3 = roomDiv.querySelector("h3");
const roomList = joinRoomDiv.querySelector("ul"); // Move roomList initialization here
roomDiv.hidden = true;
joinRoomDiv.hidden = true;

let roomName;

function addMessage(message) {
  const ul = roomDiv.querySelector("ul"); // Change room to roomDiv
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = joinForm.querySelector("input");
  socket.emit("join_room", { roomName: input.value }, () => {
    joinRoomDiv.hidden = true;
    roomDiv.hidden = false;
  });
  socket.emit("get_room");
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  const message = input.value;
  socket.emit("new_message", { msg: message, roomName: roomName }, () => {
    addMessage(`You: ${message}`);
  });
  input.value = "";
});

nicknameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  socket.emit("nickname", { nickname: input.value });
  input.value = "";
  nameDiv.hidden = true;
  joinRoomDiv.hidden = false;
});

socket.on("welcome", (res) => {
  h3.innerText = `Room ${roomName}, ${res.newCount} people`; // Use roomName here
  addMessage(`${res.nickname} joined!`);
});

socket.on("bye", (res) => {
  h3.innerText = `Room ${roomName}, ${res.newCount} people`; // Use roomName here
  addMessage(`${res.nickname} left!`);
});

socket.on("new_message", (res) => addMessage(`${res.nickname}: ${res.msg}`));

socket.on("room_change", (rooms) => {
  console.log(rooms);
  roomList.innerText = "";
  if (rooms.length === 0) {
    roomList.innerText = "no rooms";
    return;
  }

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});

socket.on("get_room", (rooms) => {
  // roomList is now defined

  roomList.innerText = "";
  if (rooms.length === 0) {
    roomList.innerText = "no rooms";
    return;
  }

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
