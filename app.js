const express = require('express');
const Nodegeocoder = require('node-geocoder');
const { createUser } = require('./Controler/user');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json())

const geocoder = Nodegeocoder({provider:'openstreetmap'})
async function fun(){
    const data = await geocoder.reverse({lat :26.9124, lon:75.7873});
    console.log(data)
}

app.post('/api/v1/register',createUser)


module.exports = app;