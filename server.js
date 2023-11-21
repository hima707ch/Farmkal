const app = require("./app");
const dotenv = require("dotenv").config({ path: "config/.env" });
const connectDB = require("./database");
const cloudinary = require("cloudinary");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);

const ChatData = require("./Models/chatting.js");

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

  socket.on("signin", (userEmailId) => {
    users[userEmailId] = socket.id;
  });

  getNewMessage(userEmailId);

  socket.on("message", (data) => {
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
      saveNewMessage(receiverEmailId, senderEmailId, message, true);
      console.log(`User ${receiverId} is offline. Save the message for later.`);
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
  let userChatData;

  userChatData = await ChatData.findOne({
    me: userEmailId,
    isNewMessage: true,
  });

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
  let myChat;
  //let friendChat;

  // find user chat
  myChat = await ChatData.findOne({ me: myEmailId, isNewMessage: isNew });
  //friendChat = await ChatData.findOne({me : friendEmailId , isNewMessage : isNew});

  // if new create user
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
  if (!([friendEmailId] in myChat)) {
    myChat[friendEmailId] = [];
  }
  /*
  if( !([myEmailId] in friendChat) ){
    friendChat[myEmailId] = [];
  }
*/
  myChat[friendEmailId].push({
    message: message,
    time: Data.now(),
    type: type,
  });
  /*
  var revType = (type === "get") ? "post" : "get";

  friendChat[myEmailId].push({
    message : message,
    time : Data.now(),
    type : revType
  });
*/
  await myChat.save();
  // await friendChat.save();
  return;
}

server.listen(4001, () => {
  `server is running on port ${process.env.PORT}`;
});
