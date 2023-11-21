const { createProduct, getProductFromCity } = require("../Controler/product");

const router = require("express").Router();

router.route("/createproduct").post(createProduct);
router.route("/getproductfromcity").post(getProductFromCity);

module.exports = router;
