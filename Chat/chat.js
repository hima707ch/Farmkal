const socketIo = require("socket.io");
const app = require("../app");
const http = require("http");

const server = http.createServer(app);
const io = socketIo(server);

const { log } = require("console");

const ChatData = require("../Models/chatting");

const users = {}; // to store user sockets

io.on("connection", (socket) => {
  console.log(`A user connected - ${socket.id}`);

  let userEmailId;

  socket.on("signin", (data) => {
    const { emailId } = data;
    log("event sign in callled");
    console.log(emailId);
    users[emailId] = socket.id;
    userEmailId = emailId;
    getNewMessage(userEmailId);
  });

  // io.emit('hi',{message : "hi"})

  // server rereciving message from frontend
  socket.on("chat", async (data) => {
    const { receiverEmailId, message } = data;

    console.log("chat msg ", message);
    await saveMessage(userEmailId, receiverEmailId, message, false, "post");

    const receiverSocketId = users[receiverEmailId];

    if (receiverSocketId) {
      console.log("inside if");

      io.to(receiverSocketId).emit("sendMsg", {
        sender: userEmailId,
        message,
      });

      await saveMessage(receiverEmailId, userEmailId, message, false, "get");
    } else {
      // saving in reciver database as new message

      await saveMessage(receiverEmailId, userEmailId, message, true, "get");
      console.log(
        `User ${receiverEmailId} is offline. Save the message for later.`,
      );
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete users[userEmailId];
  });
});

async function getNewMessage(userEmailId) {
  console.log("get new Mesage called");
  let userChatData;

  userChatData = await ChatData.findOne({
    me: userEmailId,
    isNewMessage: true,
  });

  // log(userChatData, userEmailId);

  if (!userChatData) {
    return;
  }

  log("here");

  const mySocketId = users[userEmailId];

  var senderEmails = Object.keys(userChatData);
  for (var value of senderEmails) {
    if (!value.includes("@")) {
      continue;
    }

    log("in loop");
    log(value);

    for (var ele of userChatData[value]) {
      io.to(mySocketId).emit("sendMsg", {
        sender: value,
        message: ele.message,
      });

      await saveMessage(userEmailId, value, ele.message, false, "get");
    }
    /*
      userChatData[value].map(async (ele) => {
        io.to(mySocketId).emit("sendMsg", {
          sender: value,
          message: ele.message,
        });
  
        await saveMessage(userEmailId,value,ele.message,false,"get");
      })
    ;
    */
  }

  await ChatData.deleteOne({ me: userEmailId, isNewMessage: true });
}

async function saveMessage(myEmailId, friendEmailId, message, isNew, type) {
  console.log("Save message called");
  let myChat;

  const friendEmailIdFilter = friendEmailId.replaceAll(".", "@dot@");
  const myEmailIdFilter = myEmailId.replaceAll(".", "@dot@");

  // find user chat
  myChat = await ChatData.findOne({ me: myEmailId, isNewMessage: isNew });

  // console.log(myChat);

  // if i am a new user
  if (!myChat) {
    myChat = await ChatData.create({
      me: myEmailId,
      isNewMessage: isNew,
    });
  }

  // pushing chat
  const resp = await ChatData.updateOne(
    { me: myEmailId, isNewMessage: isNew },
    {
      $push: {
        [friendEmailIdFilter]: {
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
