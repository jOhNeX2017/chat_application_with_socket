const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const webSocket = new Server(server);

var users = {};
var usersRev = {};

app.get("/test", (req, res) => {
  res.send({ data: "Hello, World!" });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


webSocket.on("connection", (socket) => {
  console.log("Socket Connection is UP!");

  socket.on("new-user", (userName) => {
    users[socket.id] = userName;
    usersRev[userName] = socket.id;
    console.log("Username", userName, users);

    // Emitting message for the joining of new user
    var usersArray = Object.keys(usersRev);
    socket.broadcast.emit("new-user-join", userName);

    // Emitting total user Count and users name array
    webSocket.emit("users", {count:Object.keys(users).length,users:usersArray});
  });


  // Connection for to notify user is typing
  socket.on("typing", (msg) => {
    if (msg.length > 0) {
      socket.broadcast.emit("typing", users[socket.id]);
    } else {
      socket.broadcast.emit("typing", null);
    }
  });

  // connection for sending the msg sent by the user
  socket.on("chat-message", (data) => {
    console.log("Message:", data.msg);
    if (data.to === "all") {
      socket.broadcast.emit("chat-message", {msg:data.msg,from:users[socket.id]});
    } else {
      console.log("UserSeleted",data.to)
      socket.to(usersRev[data.to]).emit("chat-message", {msg:data.msg,from:users[socket.id]});
    }
  });

  // Disconneting when user closes the screen 
  socket.on("disconnect", () => {
    let userName = users[socket.id];
    delete users[socket.id];
    delete usersRev[userName];
    console.log("Socket Connection is DOWN!", users);
    var usersArray = Object.keys(usersRev);
    webSocket.emit("users", {count:Object.keys(users).length,users:usersArray});
  });
});

server.listen((port = 4040), () => {
  console.log(`listening on *:${port}`);
});
