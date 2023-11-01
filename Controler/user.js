const User = require('../Models/user');
const UserCity = require('../Models/userCity');

const createUser = async (req,res)=>{
    console.log(req.body.name)
    const user = await User.create(req.body);

    if(user){
        res.status(201).json({
            success : true,
            user
        })
    }
    else{
        res.status(400).json({
            success : false,
            msg : "Invalid details"
        })
    }
}

const addUserToCity = async (city, userID)=>{

    const isCity = await UserCity.findOne({city : {$exists : true}});
    
    if(isCity){
        const res = await isCity.updateOne( {$push : {city : userID}}  )
        console.log(res)
    }
    else{
      const res = await UserCity.create({
          [city] : [userID]
      })
      console.log(res);
    }
}

module.exports = {createUser, addUserToCity};
  
