const CustomError = require("../utils/CustomError");
const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const authenticateToken = async (req,res,next)=>{
    const token = req.header('Authorization').split(' ')[1];

    if(!token){
        return next(new CustomError("Invalid user, no token", 401));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if(!decodedToken){
        return next(new CustomError("permission denied", 403));
    }

    req.user = await User.findById(decodedToken.id);

    next();
    
}

module.exports = authenticateToken;