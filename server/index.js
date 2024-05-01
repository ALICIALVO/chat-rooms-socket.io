import { createServer } from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { Server as socketServer } from "socket.io";
// import log from "@ajar/marker"; 

const {PORT,HOST,CLIENT_URL} = process.env;
const app = express();
const httpServer = createServer(app);
const io = new socketServer(httpServer, {
  cors: {
    origin: CLIENT_URL || "http://localhost:5173", 
  },
});
// express app middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// express routing
app.get("/", (req, res) => {
  res.status(200).send("Hello Express");
});

io.on("connection", (socket) => {
  // log when a client connects:
  console.log("Client connected:", socket.id); 

  socket.emit("server-msg", { message: "Welcome to the chat" });


  // handle incoming messages:
  socket.on("client-msg", ({ room, message }) => {
    if (!room || room === "general") {
      // brodcast to all clients:
      io.sockets.emit("server-msg", { message }); 
    } else {
      // brodcaast to a specific room:
      io.to(room).emit("server-msg", { message }); 
    }
       /* // Shorter version
    const targetClient = !room || room === 'general' ? io.sockets : io.to(room);
    targetClient.emit("server-msg", { message }); */
  });
  // handle "user-typing" events:
  socket.on("user-typing", ({ userId, room }) => {
    console.log("User is typing:", userId); 
    if (room && room !== "general") {
      socket.broadcast.to(room).emit("user-typing", { userId });
    } else {
      // brodacast to all except the sender:
      socket.broadcast.emit("user-typing", { userId }); 
    }
  
  });


  // handle joining and leaving rooms:
  socket.on("join-room", ({ room }) => {
    socket.join(room);
    socket.emit("server-msg", { message: `Welcome to the ${room} room.` });
    io.to(room).emit("server-msg", {
      message: `Client ${socket.id} joined the ${room} room.`,
    });
  });

  socket.on("leave-room", ({ room }) => {
    socket.leave(room);
    io.to(room).emit("server-msg", { message: `${socket.id} left the ${room} room.` });
  });

});

httpServer.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
