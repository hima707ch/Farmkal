const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((connection) => {
      console.log(`mongodb connected host = ${connection.connection.host}`);
    })
    .catch((err) => {
      console.log(`Error - ${err}`);
    });
};

module.exports = connectDB;
