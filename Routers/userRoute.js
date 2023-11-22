const {
  createUser,
  isUserExist,
  loginUser,
  getChatUserList,
  getChatData,
} = require("../Controler/user");

const router = require("express").Router();

router.route("/register").post(createUser);
router.route("/login").post(loginUser);
router.route("/chat").post(getChatUserList);
router.route("/chatdata").post(getChatData);
router.route("/isuser").post(isUserExist);

module.exports = router;
