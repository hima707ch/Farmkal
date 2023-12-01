const socketIo = require("socket.io");
const app = require("../app");
const http = require("http");
const server = http.createServer(app);
const io = socketIo(server);
const { log } = require("console");
const ChatData = require("../Models/chatting");
const User = require("../Models/user");

const users = {}; // to store user sockets

io.on("connection", (socket) => {
  console.log(`A user connected - ${socket.id}`);

  let userObjId; // my objId or sender objId

  socket.on("signin", async (userData) => {
    const { emailId, phone } = userData;
    log("event sign in callled");

    if (!emailId && !phone) {
      console.log("No email id or phone ");
      socket.emit("invalid_data", { error: "No emailId or phone recieved" });
      return;
    }

    console.log(emailId, phone);

    userObjId = await User.findOne({
      $or: [{ email: emailId }, { phone: phone }],
    })
      .select("_id")
      .exec();

    if (!userObjId) {
      res.status(400).json({
        success: false,
        message: "User/My Email or Phone not exist",
      });
    }

    userObjId = userObjId.id;
    console.log(userObjId);

    users[userObjId] = socket.id;
    getNewMessage(userObjId);
  });

  io.emit("verify_connection", { message: "hi from server" });

  // server rereciving message from frontend
  socket.on("chat", async (data) => {
    const { receiverPhone, receiverEmailId, message } = data;

    console.log("chat msg ", message);

    if (!receiverEmailId && !receiverPhone) {
      console.log(" No reciever Email or Phone ");
      socket.emit("invalid_data", {
        error: "No reciver Eamil Id or Phone recieved",
      });
      return;
    }
    if (!userObjId) {
      console.log(" No User Email Id ");
      socket.emit("invalid_data", {
        error: "No user Email Id or user Phone recieved",
      });
      return;
    }
    if (!message) {
      console.log("No message");
      socket.emit("invalid_data", { error: "No Message" });
      return;
    }

    let receiverObjId = await User.findOne({
      $or: [{ email: receiverEmailId }, { phone: receiverPhone }],
    })
      .select("id")
      .exec();

    if (!receiverObjId) {
      res.status(400).json({
        success: false,
        message: "Receiver Email or Phone not exist",
      });
    }

    receiverObjId = receiverObjId.id;

    await saveMessage(userObjId, receiverObjId, message, false, "post");

    const receiverSocketId = users[receiverObjId];

    if (receiverSocketId) {
      console.log("inside if");

      io.to(receiverSocketId).emit("sendMsg", {
        sender: userObjId,
        message,
      });

      await saveMessage(receiverObjId, userObjId, message, false, "get");
    } else {
      // saving in reciver database as new message

      await saveMessage(receiverObjId, userObjId, message, true, "get");
      console.log(
        `User ${receiverEmailId} is offline. Save the message for later.`,
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
      io.to(mySocketId).emit("sendMsg", {
        sender: key,
        message: msgDoc.message,
      });
      await saveMessage(myId, key, msgDoc.message, false, "get");
    }
  }
  await ChatData.deleteOne({ me: myId, isNewMessage: true });
}

async function saveMessage(myId, friendId, message, isNew, type) {
  console.log("Save message called");
  let myChat;

  console.log("my Id ", myId, "friendId ", friendId);

  // find user chat
  myChat = await ChatData.findOne({ me: myId, isNewMessage: isNew });

  // if i am a new user
  if (!myChat) {
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
  log("save msg over");
}

module.exports = { server };
