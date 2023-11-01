const mongoose = require('mongoose');

const productCitySchema = mongoose.Schema({
    
},{strict : false})

const ProductCity = mongoose.model('ProductCity',productCitySchema);

module.exports = ProductCity;