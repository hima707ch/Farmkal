const { createProduct, getProductFromCity, getAllProduct, getProduct, updateProduct, addImage, deleteProduct, deleteImage } = require("../Controler/product");

const router = require("express").Router();

router.route('/products').post(createProduct).get(getAllProduct);
router.route('/product/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.route('product/image').put(addImage).delete(deleteImage);


module.exports = router;
