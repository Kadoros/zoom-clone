import express from "express";
import WebSocket from "ws";
import http from "http";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/*", (req, res) => {
  res.redirect("/");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket.send("Welcome to the server!");
  socket.onclose = console.log("WebSocket connection closed. ❌");
  socket.onmessage = (message) => {
    sockets.forEach((aSocket) => aSocket.send(message.data));
  };
});

server.listen(3000, () =>
  console.log("Server is running: http://localhost:3000")
);
