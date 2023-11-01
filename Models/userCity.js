const mongoose = require('mongoose');

const userCitySchema = mongoose.Schema({

},{strict : false})

const UserCity = mongoose.model('UserCity',userCitySchema);

module.exports = UserCity;