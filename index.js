
const port = process.env.PORT || 8900
const io = require("socket.io")(port,{
    cors:{
        origin: "*" // specifies the port where clint request comes in
   
    },
 
});

let users = [];
const addUser = (userId, socketId)=>{
    !users.some((user)=> user.userId === userId)&& users.push({userId, socketId});
}

const removeUser = (socketId)=>{
    users = users.filter(user=> user.socketId !== socketId)
}

const getUser = (userId)=>{
    return users.find(user=> user.userId=== userId);
}

io.on("connection", (socket)=>{
    //when the user is connected
    console.log("a user connected")
    // take userId and socketId from the user
    socket.on("addUser", userId=>{
       addUser(userId, socket.id);
       io.emit("getUsers", users)
    })

    //send and get messages
    socket.on("sendMessage",({senderId, receiverId,text})=>{
       const user = getUser(receiverId);
       io.to(user?.socketId).emit("getMessage", {
        senderId,text,
       })
    })
    //whhen the user is disconnected
    socket.on("disconnect", ()=>{
        console.log("a user disconnected! ")
        removeUser(socket.id)
    })
})
