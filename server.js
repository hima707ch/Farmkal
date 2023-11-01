const app = require('./app');
const dotenv = require('dotenv').config({path:'config/.env'});
const connectDB = require('./database');

connectDB();

// Cloudinary Config

const server = app.listen(process.env.PORT,()=>{`server is running on port ${process.env.PORT}`});