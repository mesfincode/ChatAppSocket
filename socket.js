const axios = require('axios')
const dotenv = require('dotenv').config();

const url = process.env.NODE_ENV==='development' ? process.env.DEV_API_URL:process.env.PROD_API_URL
console.log(process.env.PROD_API_URL)
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
   console.log(users);
}

const removeUser = (socketId)=>{
    users = users.filter(user=> user.socketId !== socketId)
}

const getUser = (userId)=>{
    return users.find(user=> user.userId === userId);
}
const getUserWithSocketId = (socketId)=>{
    return users.find(user=> user.socketId === socketId);
}
io.on("connection", (socket)=>{
    //when the user is connected
    // take userId and socketId from the user
    socket.emit('me', socket.id)
    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        console.log('calling user...')
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
    
    socket.on("userHangup", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
    socket.on("addUser", userId=>{
        console.log("user to be added",userId)
        if(userId){
            addUser(userId, socket.id);

        }
        socket.join(userId);

       io.emit("getUsers", users)
       console.log("a user added",users)
    console.log(users)
    });
   
    
    socket.on("isTyping",({senderId, receiverId,text,senderName,conversationId})=>{

        const user = getUser(receiverId);
       
      
        io.to(user?.socketId).emit("yourFriendIsTyping", {
         senderId,senderName,conversationId,text
        })
        // console.log("message received:", text, " Socket Id:", user?.socketId, senderId)
        console.log(`${senderName} is typing`,"....",text)
     })
    //send and get messages
    socket.on("sendMessage",({senderId, receiverId,text,senderName,conversationId,encryptedMessage})=>{
       
       console.log("message receiver ...", receiverId)
        const user = getUser(receiverId);
      
    
    //    io.to(user?.socketId).emit("getMessage", {
    //     senderId,text,senderName,conversationId,encryptedMessage
    //    })
       io.to(receiverId).emit("getMessage",{
        senderId,text,senderName,conversationId,encryptedMessage
       });

       console.log("message received:", text,encryptedMessage, " Socket Id:", user?.socketId, senderId)
    })

    socket.on("send-secureMessage",({senderId, receiverId,senderName,conversationId,encryptedMessage})=>{
        const user = getUser(receiverId);

        io.to(user?.socketId).emit("get-secureMessage", {
         senderId,senderName,conversationId,encryptedMessage
        })
        console.log("message received:",encryptedMessage, " Socket Id:", user?.socketId, senderId)
     })

    socket.on("messageReceived",({senderId, receiverId,text,senderName,createdAt,conversationId})=>{
        const user = getUser(receiverId);
       console.log(senderName,text)
     
        io.to(user?.socketId).emit("yourMessageHasbeenRead", {
            receiverId,text,senderName,createdAt,conversationId
        })
        // const mesRes = await axios.get("/api/messages/get-messages/"+ conRes.data?._id ,config);
        const makeMessageRead= async()=>{
            try{

             const res = await axios.put(`${url}api/messages/make-messages-read/${conversationId}`,{reader:senderId})
            

            }catch(err){
             
           console.log(err)
            }
          }
       
            makeMessageRead()
      
        // console.log("message received:", text, " Socket Id:", user?.socketId, senderId)
     })

     socket.on("secure-messageReceived",({senderId, receiverId,text,senderName,createdAt,conversationId})=>{
        const user = getUser(receiverId);
       console.log(senderName,text)
     
        io.to(user?.socketId).emit("your-secureMessageHasbeenRead", {
            receiverId,text,senderName,createdAt,conversationId
        })
        
      
        // console.log("message received:", text, " Socket Id:", user?.socketId, senderId)
     })

    socket.on("ping from input", userId=>{
        if(userId){
            addUser(userId, socket.id);

        }
     
        io.emit("ping", "hello from server")
        console.log('ping from input', userId)
     })

    //whhen the user is disconnected
    socket.on("disconnect", ()=>{
        socket.broadcast.emit('callended')
        const user = getUserWithSocketId(socket.id);
      
        const updateOnlineStatus= async()=>{
            try{

             const res = await axios.put(`${url}api/users/update-user-online-status/${user.userId}`)
              console.log(res.data)

            }catch(err){
             
           console.log(err)
            }
          }
          if(user){
            updateOnlineStatus()
          }
          console.log(user)
        removeUser(socket.id)
      
        io.emit("getUsers", users)
        console.log("a user disconnected! ")

    })
})
