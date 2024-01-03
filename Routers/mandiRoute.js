const {
  getCityApi,
  getMandiPrice,
  getMarketApi,
  getCommodity,
} = require("../Controler/mandiController");

const router = require("express").Router();

router.route("/city/:state").get(getCityApi);
router.route("/market/:state/:city").get(getMarketApi);
router.route("/mandidata").get(getMandiPrice);
router.route("/commodity").get(getCommodity);

module.exports = router;
