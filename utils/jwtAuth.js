const jwt = require("jsonwebtoken");

const sendToken = (user, statuscode, res) => {

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(statuscode).json({
    success: true,
    user,
    token,
  });
  
};

module.exports = sendToken;
