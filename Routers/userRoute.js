const {
  createUser,
  isUserExist,
  loginUser,
  createChat,
  getChatUserList,
  getChatData,
  testFunction,
} = require("../Controler/user");

const router = require("express").Router();

router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route("/chat").post(getChatUserList);
router.route("/chatdata").post(getChatData);
router.route("/isuser").post(isUserExist);
router.route("/test").get(testFunction);

module.exports = router;
