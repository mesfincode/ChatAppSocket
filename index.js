
const port = process.env.PORT || 8900
const io = require("socket.io")(port,{
    cors:{
        //origin: "http://localhost:3000"
       //origin: "", // specifies the port where clint request comes in,
       headers: {
        "Access-Control-Allow-Origin": "*",
      }
    },
});

var users = [];
const addUser = (userId, socketId)=>{
    !users.some((user)=> user.userId === userId)&& users.push({userId, socketId});
   
}

const removeUser = (socketId)=>{
    users = users.filter(user=> user.socketId !== socketId)
}

const getUser = (userId)=>{
    return users.find(user=> user.userId === userId);
}

io.on("connection", (socket)=>{
    //when the user is connected
    // take userId and socketId from the user
    socket.on("addUser", userId=>{
       addUser(userId, socket.id);
    
       io.emit("getUsers", users)
       console.log("a user added")
    console.log(users)
    })
   

    //send and get messages
    socket.on("sendMessage",({senderId, receiverId,text})=>{
       const user = getUser(receiverId);
      
    
       io.to(user?.socketId).emit("getMessage", {
        senderId,text,
       })
       console.log("message received:", text, " Socket Id:", user?.socketId, senderId)
    })
    //whhen the user is disconnected
    socket.on("disconnect", ()=>{
        removeUser(socket.id)
        console.log("a user disconnected! ")

    })
})
