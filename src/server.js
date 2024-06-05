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
  console.log("New WebSocket connection established. ✔");
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  socket.send("Welcome to the server!");

  socket.on("close", () => {
    console.log("WebSocket connection closed. ❌");
  });
  socket.on("message", (message) => {
    const persed = JSON.parse(message);
    switch (persed.type) {
      case "nickname":
        socket["nickname"] = persed.payload;
        break;
      case "msg":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${persed.payload}`)
        );
        break;
    }
  });
  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(3000, () =>
  console.log("Server is running: http://localhost:3000")
);
