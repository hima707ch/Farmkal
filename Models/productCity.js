const mongoose = require('mongoose');

const productCitySchema = mongoose.Schema({
    city : String,
    latitude : Number,
    longitude : Number,

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