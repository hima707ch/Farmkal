const User = require("../Models/user");
const UserCity = require("../Models/userCity");
const ChatData = require("../Models/chatting");
const sendToken = require("../utils/jwtAuth");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const createUser = async (req, res) => {
  try {
    console.log(req.files);

    const {
      name,
      email,
      password,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const userData = {
      name,
      email,
      password,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    const user = await User.create(userData);

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Error creating user",
      });
      return;
    }

    // uploading image
    if (user) {
      try {
        if (req.files && req.files.avatar) {
          await cloudinary.uploader
            .upload_stream(
              { folder: "Farmkal/Users", width: 150, crop: "scale" },
              async (error, result) => {
                if (error) {
                  console.error("Error uploading image:", error);
                } else {
                  console.log("Image uploaded successfully:", result);
                  user.avatar = {
                    public_id: result.public_id,
                    url: result.secure_url,
                  };

                  const resp = await user.save();
                  console.log(resp);
                }
              },
            )
            .end(req.files.avatar.data);
        }
      } catch (err) {
        console.log("Error uploading image");
        console.log(err);
      }

      if (city != null && city.length > 0) {
        addUserToCity(city, user._id);
      }

      res.status(201).json({
        success: true,
        user,
      });
    } else {
      res.json({
        success: false,
        msg: "Invalid details",
      });
    }
  } catch (err) {
    console.log(err);
    console.log(err.code);

    if (err.code == "11000") {
      res.status(400).json({
        success: false,
        message: "Email or phone already Exist",
      });
    }
  }
};

const addUserToCity = async (city, userID) => {
  const isCity = await UserCity.findOne({ city: { $exists: true } });

  if (isCity) {
    const res = await isCity.updateOne({ $push: { city: userID } });
    console.log(res);
  } else {
    const res = await UserCity.create({
      [city]: [userID],
    });
    console.log(res);
  }
};

const isUserExist = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    const result = user ? true : false;

    res.status(200).json({
      exist: result,
    });
  } catch (err) {
    console.log(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Empty fields",
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
      return;
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
      return;
    }

    sendToken(user, 200, res);
    return;
  } catch (err) {
    
    console.log(err);
  }
};

const getChatUserList = async (req, res) => {
  console.log("get chat list calledis");
  try {
    console.log(req.body);

    const { myEmail, phone } = req.body;

    let myId = await User.findOne({
      $or: [{ email: myEmail }, { phone: phone }],
    })
      .select("id")
      .exec();

    if (!myId) {
      res.status(400).json({
        success: false,
        message: "Email or Phone not exist",
      });
      return;
    }

    myId = myId.id;

    const chatList = await ChatData.findOne({ me: myId });

    if (!chatList) {
      res.status(400).json({
        success: true,
        message: "No Chat List Exist",
      });
      return;
    }
    // console.log(chatData, req.body.myEmail);

    // db chat data all keys
    const keys = Object.keys(chatList);
    // console.log(keys);

    const nameWithEmailArray = []; // result

    for (var uniqueId of keys) {
      console.log("uniqueId ", uniqueId);

      if (!Array.isArray(chatList[uniqueId])) continue;

      const user = await User.findById(uniqueId).select("name email").exec();

      if (!user) {
        console.log("PROD ERROR : A user without Reistration using chat");
        continue;
      }

      console.log("user", user, user.name);

      nameWithEmailArray.push({
        email: user.email,
        name: user.name,
      });
    }

    res.status(200).json({
      success: true,
      emailList: nameWithEmailArray,
    });
  } catch (err) {
    console.log(err);
  }
};

const getChatData = async (req, res) => {
  console.log("get chat data called");
  try {
    console.log(req.body);

    const { myEmail, myPhone, friendEmail, friendPhone } = req.body;

    if (!friendEmail && !friendPhone) {
      res.status(400).json({
        success: false,
        message: "Please provide friendEmail or friendPhone",
      });
      return;
    }
    if (!myEmail && !myPhone) {
      res.status(400).json({
        success: false,
        message: "Please provide myEmail or myPhone",
      });
      return;
    }

    let myId = await User.findOne({
      $or: [{ email: myEmail }, { phone: myPhone }],
    })
      .select("id")
      .exec();

    if (!myId) {
      res.status(400).json({
        success: false,
        message: " my Email or Phone not exist",
      });
      return;
    }

    myId = myId.id;

    let friendId = await User.findOne({
      $or: [{ email: friendEmail }, { phone: friendPhone }],
    })
      .select("id")
      .exec();

    if (!friendId) {
      res.status(400).json({
        success: false,
        message: " friend Email or Phone not exist",
      });
      return;
    }

    friendId = friendId.id;

    const chat = await ChatData.findOne({ me: myId }).select(friendId).exec();

    console.log("chat ", chat);
    if (!chat) {
      res.status(400).json({
        success: true,
        message: "No chat exist",
      });
      return;
    }

    res.status(200).json({
      success: true,
      chatData: chat[friendId] || [],
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  createUser,
  addUserToCity,
  isUserExist,
  loginUser,
  getChatUserList,
  getChatData,
};
