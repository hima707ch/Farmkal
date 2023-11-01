const Product = require('../Models/product');
const ProductCity = require('../Models/productCity');
const geolocation = require('reverse-geocode');

const createProduct = async (req,res)=>{
    try{

        const sampleData = {
            name : "fencing wires",
            description : "hi",
            price : 5000,
            category : 'solid',
            city : 'Kota'
        }

        const product = await Product.create(sampleData)
        console.log(product)
        addProductToCity(product.city, product._id)
    }
    catch(err){
        console.log(err);
    }
}

const addProductToCity = async (city,productID)=>{
    try{
        const isCity = await ProductCity.findOne({city : {$exists : true}});

        if(isCity){
            const res = await isCity.updateOne( {$push : {city : productID}}  )
            console.log(res)
        }
        else{
        const res = await ProductCity.create({
            [city] : [productID]
        })
        console.log(res);
        }
    }
    catch(err){
        console.log(err);
    }
}

module.exports = {createProduct,addProductToCity};