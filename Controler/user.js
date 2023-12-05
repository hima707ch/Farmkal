const User = require("../Models/user");
const UserCity = require("../Models/userCity");
const ChatData = require("../Models/chatting");
const sendToken = require("../utils/jwtAuth");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const CustomError = require("../utils/CustomError");
const uploadImageToCloudinary = require("../utils/uploadImage");
const ApiFeatures = require("../utils/ApiFeatures");
const cloudinary = require("cloudinary").v2;

const createUser = async (req, res, next) => {
  try {
    console.log(req.files);

    const {
      name,
      email,
      password,
      photoUrl,
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
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    const user = await User.create(userData);

    // uploading image
    if (user && req.files && req.files.avatar) {
      uploadImageToCloudinary(req.files.avatar, user, "Farmkal/Users", false);
    }
      if (city != null && city.length > 0) {
        await addUserToCity(city, user._id);
      }

      res.status(201).json({
        success: true,
        user,
      });
    
  } catch (err) {
    next(err);
  }
};

const createOrUpdateUser = async (req, res, next) => {
  try {
    console.log("c or up user", req.body);

    const {id} = req.params;

    const {
      name,
      email,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const data = {
      name,
      email,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    let user;

    if (phone) console.log(phone);

    if (!id && !email && !phone) {
      return next(new CustomError("provide user id or email or phone", 400));
    }

    if (id) {
      user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        useFindAndModify: true,
      });
    } else {
      user = await User.create(data);

      if (city && city.length > 0) {
        await addUserToCity(city, user.id);
      }
    }

    console.log("user created");

    if (user && req.files && req.files.avatar) {
      uploadImageToCloudinary(req.files.avatar, user, "Farmkal/Users", false);
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const addUserToCity = async (city, userID, next) => {
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

const loginUser = async (req,res,next) =>{

  const {email, phone} = req.body;

  const user = await User.findOne({ $or: [{ email: email }, { phone: phone }] });

    if (!user) {
      return next(new CustomError("Invalid email or phone", 400));
    }

    // authentication

    sendToken(user, 200, res);

}

const loginUserWithPassword = async (req, res, next) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return next(new CustomError("Email or password missing", 400));
    }

    const user = await User.findOne({ userName });

    if (!user) {
      return next(new CustomError("Invalid email or password", 400));
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new CustomError("Invalid email or password", 400));
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

const getChatUserList = async (req, res, next) => {
  console.log("get chat list called");
  try {
    console.log(req.body);

    const { myEmail, phone } = req.body;

    let myId = await User.findOne({
      $or: [{ email: myEmail }, { phone: phone }],
    })
      .select("id")
      .exec();

    if (!myId) {
      return next(new CustomError("Email or Phone not exist ", 400));
    }

    myId = myId.id;

    const myAllChat = await ChatData.findOne({ me: myId });

    if (!myAllChat) {
      res.status(200).json({
        success: true,
        message: "No chat exist",
        emailList: [],
      });
      return;
    }

    const keys = Object.keys(myAllChat);

    const nameWithEmailArray = []; // result

    for (var uniqueId of keys) {
      console.log("uniqueId ", uniqueId);

      if (!Array.isArray(myAllChat[uniqueId])) continue;

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
    next(err);
  }
};

const getChatData = async (req, res, next) => {
  console.log("get chat data called");

  try {
    console.log(req.body);

    const { myEmail, myPhone, friendEmail, friendPhone } = req.body;

    if (!friendEmail && !friendPhone) {
      return next(
        new CustomError("Please provide friendEmail or friendPhone", 400),
      );
    }
    if (!myEmail && !myPhone) {
      return next(new CustomError("Please provide myEmail or myPhone", 400));
    }

    let me = await User.findOne({
      $or: [{ email: myEmail }, { phone: myPhone }],
    })
      .select("id")
      .exec();

    if (!me) {
      return next(new CustomError("myEmail or Phone is Invalid", 401));
    }

    let myId = me.id;

    let friend = await User.findOne({
      $or: [{ email: friendEmail }, { phone: friendPhone }],
    })
      .select("id")
      .exec();

    if (!friend) {
      return next(new CustomError("friend Email or Phone not exist", 401));
    }

    let friendId = friend.id;

    const chat = await ChatData.findOne({ me: myId }).select(friendId).exec();

    console.log("chat ", chat);
    if (!chat) {
      res.status(200).json({
        success: true,
        message: "No chat exist",
        chatData: [],
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

// Admin route

const getAllUser = async (req, res, next) => {
  try {
    const apifeatures = new ApiFeatures(User.find(), req.query)
      .search()
      .filter()
      .paginate();

    const users = await apifeatures.query;

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    nexr(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(200).json({
      success : true,
      user
    })

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  createOrUpdateUser,
  loginUser,
  getChatUserList,
  getChatData,
  getAllUser,
  getUser,
};
