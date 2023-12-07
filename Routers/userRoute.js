const {
  createOrLogin,
  updateUser,
  loginWithPassword,
  getChatUserList,
  getChatData,
  getAllUser,
  getUser
} = require("../Controler/user");
const authenticateToken = require("../Middleware/authUser");

const router = require("express").Router();

router.route("/user").post(createOrLogin).put(authenticateToken, updateUser);
router.route("/login").post(loginWithPassword);

router.route("/chat").get( authenticateToken, getChatUserList);
router.route("/chat/:id").get(authenticateToken, getChatData);

module.exports = router;
