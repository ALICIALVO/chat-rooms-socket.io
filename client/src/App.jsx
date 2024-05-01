import { useEffect, useState, useRef } from "react";
import { joinRoom, sendSocketMessage, fetchREST } from "./network/chat.api.js";
import { socket } from "./network/chat.api.js";

import.meta.env;

function App() {
  const [socketId, setSocketId] = useState(null); 
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState("");
  const input = useRef();
  const currentRoom = useRef("general");
  const typingTimeout = useRef(null); 

  useEffect(() => {
  
    socket.on("connect", () => {
      const shortenedId = socket.id.slice(0, 5); 
      // store shortened ID:
      setSocketId(shortenedId); 
      // console.log("Connected with shortened Socket.IO ID:", shortenedId); 
    });

    // listen for incoming server messages:
    socket.on("server-msg", (data) => {
      setMessages((existingMessages) => existingMessages + `> ${data.message}\n`);
    });

    // listen for "user-typing" events to update the list of typing users:
    socket.on("user-typing", (data) => {
      // get the user ID from event data:
      const { userId } = data; 

      if (!typingUsers.includes(userId)) {
        setTypingUsers((prev) => [...prev, userId]);
      }

      clearTimeout(typingTimeout.current); 
      typingTimeout.current = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((user) => user !== userId)); 
      }, 2000);
    });

    // cleanup event listeners on component unmount:::
    return () => {
      socket.off("connect");
      socket.off("server-msg");
      socket.off("user-typing");
    };
  }, [typingUsers]);

  const onsubmit = (event) => {
    event.preventDefault();
    sendSocketMessage(input.current.value, currentRoom.current); 
    input.current.value = ""; 
  };

  // emit "user-typing" when typing occurs::
  const handleTyping = () => {
    if (socketId) {
      // emit the shortened ID:
      socket.emit("user-typing", { userId: socketId, room: currentRoom.current }); 
    }


    // clear previous timeout:
    clearTimeout(typingTimeout.current); 
    typingTimeout.current = setTimeout(() => {}, 2000); 
  };

  const onChannelsClick = (event) => {
    currentRoom.current = event.target.dataset.room;
    // join the new room:
    joinRoom(currentRoom.current); 
  };

  return (
    <div className="main">
      <div className="user-typing">
        {typingUsers.map((user) => (
          <div key={user}>User with ID {user} is typing...</div> 
        ))}
      </div>
      <form className="write-form" onSubmit={onsubmit}>
        <textarea className="output" read-only value={messages}></textarea>
        <div className="bottom-box">
          <input
            ref={input}
            placeholder="Write a message..."
            className="input"
            // emit "user-typing" with shortened ID::
            onKeyUp={handleTyping} 
          />
          <button type="submit">Send</button>
        </div>
      </form>
      <div className="channels" onClick={onChannelsClick}>
        <button className="channel" data-room="news">News</button>
        <button className="channel" data-room="random">Random</button>
        <button className="channel" data-room="tech">Tech</button>
      </div>
    </div>
  );
}

export default App;