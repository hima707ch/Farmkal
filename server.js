const app = require("./app");
const dotenv = require("dotenv").config({ path: "config/.env" });
const connectDB = require("./database");
const cloudinary = require("cloudinary");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);

const ChatData = require("./Models/chatting.js");
const { log } = require("console");

connectDB();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const users = {}; // to store user sockets

io.on("connection", (socket) => {
  console.log(`A user connected - ${socket.id}`);

  let userEmailId = "him1@g.com";

  socket.on("signin", (data) => {
    const { emailId } = data; 
    log("event sign in callled");
    users[emailId] = socket.id;
    userEmailId = emailId;
    getNewMessage(userEmailId);
  });


  // server rereciving message from frontend
  socket.on("chat", (data) => {
    const { receiverEmailId, message } = data;

    saveMessage(userEmailId, receiverEmailId, message, false, "post");

    // is receiver online
    const receiverSocketId = users[receiverEmailId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEmit", {
        sender: userEmailId,
        message,
      });
    } else {

      // saving in reciver database as new message 

      saveMessage(receiverEmailId, userEmailId, message, true, "get" );
      console.log(`User ${receiverEmailId} is offline. Save the message for later.`);
    }
  });

  socket.on("messageEmit", (data) => {
    const { sender, message } = data;

    saveMessage(userEmailId, sender, message, false, "get");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});



async function getNewMessage(userEmailId) {
  console.log("get new Mesage called");
  let userChatData;

  userChatData = await ChatData.findOne({
    me: userEmailId,
    isNewMessage: true,
  });

  if(!userChatData){
    return;
  }

  const mySocketId = users[userEmailId];

  var senderEmails = Object.keys(userChatData);

  for (var value of senderEmails) {
    if (
      value === "isNewMessage" ||
      value === "lastSeen" ||
      value === "receiver"
    ) {
      continue;
    }

    const senderEmail = value;

    userChatData[value].map((ele) => {
      io.to(mySocketId).emit("messageEmit", {
        sender: value,
        message: ele.message,
      });
      return {};
    });

    userChatData[value] = [];
  }
}

async function saveMessage(myEmailId, friendEmailId, message, isNew, type) {
  console.log("Save message called");
  let myChat;
  //let friendChat;

  // find user chat
  myChat = await ChatData.findOne({ me: myEmailId, isNewMessage: isNew });
  //friendChat = await ChatData.findOne({me : friendEmailId , isNewMessage : isNew});

  console.log(myChat);

  // if i am a new user
  if (!myChat) {
    myChat = await ChatData.create({
      me: myEmailId,
      isNewMessage: isNew,
    });
  }
  /*
  if(!friendChat){
    friendChat = await ChatData.create({
      me : friendEmailId,
      isNewMessage : isNew,
    })
  }
*/
// if chat with friend is first time create it

// uncomment below
/*
log("check chat" ,[friendEmailId] in myChat )
  if (!([friendEmailId] in myChat)) {
    log("inside if")


    const resp = await ChatData.updateOne({"me" : myEmailId, isNewMessage : isNew},{$set:{[friendEmailId] : ["demo","delete1"]} })

    //myChat.sample = "sample";

    
   
    log(`my chat empty arr `,myChat);
   
    //await myChat.save;

  }
*/

  
  /*
  if( !([myEmailId] in friendChat) ){
    friendChat[myEmailId] = [];
  }
*/
/*
// Adding chat message
  myChat[friendEmailId].push({
    message: message,
    time: Date.now(),
    type: type,
  });
  log(`my chat ${myChat}`);
  /*
  var revType = (type === "get") ? "post" : "get";

  friendChat[myEmailId].push({
    message : message,
    time : Data.now(),
    type : revType
  });
*/




// uncomment below
/*
  await myChat.save();
  // await friendChat.save();
  return;
  */
}

server.listen(4001, () => {
  `server is running on port ${process.env.PORT}`;
});
