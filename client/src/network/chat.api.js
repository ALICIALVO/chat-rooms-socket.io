import { io } from "socket.io-client";

const {VITE_SERVER_URL} = import.meta.env;

console.log(`SERVER_URL: ${VITE_SERVER_URL}`);
console.log(`MODE: ${import.meta.env.MODE}`);

//connects to the current domain/port/protocol
export const socket = io(VITE_SERVER_URL,{});
// export const socket = io("http://localhost:3030", {});

socket.on("connect", () => {
  console.log("socket connected", socket.id);
});


export async function sendSocketMessage(message,room){
    console.log('sendSocketMessage:',message,room);
    socket.emit('client-msg', { room , message } );
}

export async function joinRoom(room){
    console.log('join-room:',room);
    socket.emit('join-room', { room } );
}

export async function leaveRoom(room){
    console.log('leave-room:',room);
    socket.emit('leave-room', { room } );
}



export async function fetchREST(){
    const response = await (await fetch(VITE_SERVER_URL)).text();
    // const response = await (await fetch("http://localhost:3030")).text();
    console.log({response});
}