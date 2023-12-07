const User = require("../Models/user");
const ChatData = require("../Models/chatting");
const sendToken = require("../utils/jwtAuth");
const CustomError = require("../utils/CustomError");
const uploadImageToCloudinary = require("../utils/uploadImage");
const ApiFeatures = require("../utils/ApiFeatures");
const bcryptjs = require('bcryptjs');


const createOrLogin = async (req,res,next)=>{
  try {
    console.log(req.files);

    const {
      name,
      email,
      username,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const uniqueId = email || phone || username;

    let user = await User.findOne({ $or: [{ email : uniqueId }, { phone : uniqueId }, { username : uniqueId }] });

    if(user){
      sendToken(user,200,res);
      return;
    }

    const userData = {
      name,
      email,
      username,
      password,
      photoUrl,
      phone,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    user = await User.create(userData);

    if(!user) {
      return next(new CustomError("Error creating user", 500));
    }

    // uploading image
    if (user && req.files && req.files.avatar) {
      uploadImageToCloudinary(req.files.avatar, user, "Farmkal/Users", false);
    }      

    sendToken(user, 200, res);
    
  } catch (err) {
    next(err);
  }
}

const updateUser = async (req, res, next) => {
  try {
    console.log("c or up user", req.body);

    const {id} = req.params;

    const {
      name,
      photoUrl,
      bio,
      latitude,
      longitude,
      state,
      city,
    } = req.body;

    const data = {
      name,
      photoUrl,
      bio,
      latitude,
      longitude,
      state,
      city,
    };

    let user = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });

    if(!user){
      return next(new CustomError("Erro creating user"));
    }

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

const loginWithPassword = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new CustomError("Username or password missing", 400));
    }

    const user = await User.findOne({ username });

    if (!user) {
      return next(new CustomError("Invalid username or password", 400));
    }

    const isPasswordMatch = await bcryptjs.compare(password, user.password);

    if (!isPasswordMatch) {
      return next(new CustomError("Invalid username or password", 400));
    }

    delete user.password;

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

const getChatUserList = async (req, res, next) => {
  console.log("get chat list called");
  try {
    console.log(req.body);

    const myAllChat = await ChatData.findOne({ me: req.user.id });

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

      const user = await User.findById(uniqueId).select("name").exec();

      if (!user) {
        console.log("PROD ERROR : A user without Reistration using chat");
        continue;
      }

      console.log("user", user, user.name);

      nameWithEmailArray.push({
        email: user.email,
        uniqueId: uniqueId,

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

    let friendId = req.params.id;

    const chat = await ChatData.findOne({ me : req.user.id}).select(friendId).exec();
    
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

const sellItems = async (req,res,next)=>{
  
  const user = await User.findById(req.user.id).populate('sellItems');

  const products = user.sellItems;

  res.status(200).json({
    success : true,
    sellItems
  });
}

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
  createOrLogin,
  updateUser,
  loginWithPassword,
  getChatUserList,
  getChatData,
  getAllUser,
  getUser
};
