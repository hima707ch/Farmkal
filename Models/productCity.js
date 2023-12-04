const mongoose = require('mongoose');

const productCitySchema = mongoose.Schema({
    name : String,
    solid : [{
        type : mongoose.Schema.Types.ObjectId,
         ref: 'Product' 
    }],
    vechiel : [{
        type : mongoose.Schema.Types.ObjectId,
         ref: 'Product' 
    }],
    
},{strict : false})

const ProductCity = mongoose.model('ProductCity',productCitySchema);

module.exports = ProductCity;