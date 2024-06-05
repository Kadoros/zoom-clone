import express from "express";
import { Server } from "socket.io";
import http from "http";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => {
  res.render("home");
});
app.get("/*", (_, res) => {
  res.redirect("/");
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  console.log("Connected to Browser ✅");
  socket["nickname"] = "Anonymous";

  socket.on("join_room", (res, cb) => {
    socket.join(res.roomName);
    cb();
    setTimeout(() => {
      console.log(`Socket ${socket.id} joined room ${res.roomName}`);
      console.log(
        `New count in room ${res.roomName}: ${countRoom(res.roomName)}`
      );
      socket.to(res.roomName).emit("welcome", {
        nickname: socket.nickname,
        newCount: countRoom(res.roomName),
      });
      wsServer.sockets.emit("room_change", publicRooms());
    }, 10);
  });

  socket.on("get_room", () => {
    wsServer.sockets.emit("get_room", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", {
        nickname: socket.nickname,
        newCount: countRoom(room) - 1,
      });
    });
  });

  socket.on("disconnect", (res, cb) => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (res, cb) => {
    socket
      .to(res.roomName)
      .emit("new_message", { nickname: socket.nickname, msg: res.msg });
    cb();
  });

  socket.on("nickname", (res) => {
    socket["nickname"] = res.nickname;
    wsServer.sockets.emit("room_change", publicRooms());
  });
});

httpServer.listen(3000, () =>
  console.log("Server is running: http://localhost:3000")
);
