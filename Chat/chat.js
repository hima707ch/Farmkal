const socketIo = require("socket.io");
const app = require("../app");
const http = require("http");
const { log } = require("console");
const ChatData = require("../Models/chatting");
const User = require("../Models/user");

const server = http.createServer(app);

const io = socketIo(server);

const users = {}; // to store user sockets

io.on("connection", (socket) => {
  console.log(`A user connected - ${socket.id}`);

  let userObjId; // my objId or sender objId

  socket.on("signin", async (userData) => {
    const { id } = userData;
    log("event sign in callled");

    if (!id) {
      console.log("No user id");
      socket.emit("invalid_data", { error: "No user id" });
      return;
    }

    userObjId = id;

    users[userObjId] = socket.id;
    getNewMessage(userObjId);
  });

  io.emit("verify_connection", { message: "hi from server" });

  // server rereciving message from frontend
  socket.on("chat", async (data) => {
    const { receiverUserId, message } = data;

    console.log("chat msg ", message);

    if (!receiverUserId) {
      console.log(" No receiverUserId ");
      socket.emit("invalid_data", {
        error: "No receiverUserId",
      });
      return;
    }
    if (!userObjId) {
      console.log(" No User Id ");
      socket.emit("invalid_data", {
        error: "please sign in before sending chat",
      });
      return;
    }
    if (!message) {
      console.log("No message");
      socket.emit("invalid_data", { error: "No Message" });
      return;
    }

    await saveMessage(userObjId, receiverUserId, message, false, "post", {});

    const receiverSocketId = users[receiverUserId];

    console.log("rec soc id", receiverSocketId);

    if (receiverSocketId) {
      console.log("inside if");

      io.to(receiverSocketId).emit("sendMsg", {
        sender: userObjId,
        message,
      });

      await saveMessage(receiverUserId, userObjId, message, false, "get", {});
    } else {
      // saving in reciver database as new message

      await saveMessage(receiverUserId, userObjId, message, true, "get", {});
      console.log(
        `User ${receiverUserId} is offline. Save the message for later.`,
      );
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete users[userObjId];
  });
});

async function getNewMessage(myId) {
  console.log("get new Mesage called");
  let userChatData;

  userChatData = await ChatData.findOne({
    me: myId,
    isNewMessage: true,
  });

  if (!userChatData) {
    return;
  }

  const mySocketId = users[myId];
  var keys = Object.keys(userChatData);

  // Iterating keys of user chat
  for (var key of keys) {
    if (!Array.isArray(userChatData[key])) {
      continue;
    }

    // Iterating messaghe of particular email
    for (var msgDoc of userChatData[key]) {
      console.log("line 116");
      io.to(mySocketId).emit("sendMsg", {
        sender: key,
        message: msgDoc.message,
      });
      await saveMessage(myId, key, msgDoc.message, false, "get", {});
    }
  }
  await ChatData.deleteOne({ me: myId, isNewMessage: true });
}

async function saveMessage(myId, friendId, message, isNew, type, optional) {
  console.log("Save message called");

  // find user chat
  let myChat = await ChatData.findOne({ me: myId, isNewMessage: isNew });

  // if i am a new user
  if (!myChat) {
    console.log("new user");

    myChat = await ChatData.create({
      me: myId,
      isNewMessage: isNew,
    });
  }

  // pushing chat

  const resp = await ChatData.updateOne(
    { me: myId, isNewMessage: isNew },
    {
      $push: {
        [friendId]: {
          message: message,
          time: Date.now(),
          type: type,
        },
      },
    },
    { upsert: true },
  );

  /*
  if(isNew == false && !myChat[friendId]){

    const friend = await User.findById(friendId);

    console.log(friend, friendId);

    myChat[friendId] = {
      name : friend.name,
    };

    if(optional.product){
      myChat[friendId].productId = optional.product.id || null,
      myChat[friendId].productName = optional.product.name || null
    }
    myChat[friendId]['chats'] = [];
    console.log(myChat[friendId]['chats']);
   
  }

  let temp = friendId + '.chats';

  if(myChat[temp]){
    myChat[temp].push({
      message: message,
      time: Date.now(),
      type: type,
    });
  }

  else {
    myChat[temp] = [{
      message: message,
      time: Date.now(),
      type: type,
    }]
  }


  temp = friendId + '.latest'
  myChat[temp] = Date.now();

  await myChat.save();
*/

  log("save msg over");
}

module.exports = { server };
