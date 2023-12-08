const {
  createUser,
  isUserExist,
  loginUser,
  getChatUserList,
  getChatData,
  createOrUpdateUser,
} = require("../Controler/user");

const router = require("express").Router();

router.route("/registerpassword").post(createUser);
router.route("/login").post(loginUser);
router.post("/createorupdate", createOrUpdateUser);
router.route("/chat").post(getChatUserList);
router.route("/chatdata").post(getChatData);

module.exports = router;
