const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  // Send by User
  name: {
    type: String,
  },
  email: {
    type: String,
    sparse : true,
    unique : true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  username : {
    type : String,
    sparse : true,
    unique : true
  },
  password: {
    type: String,
    minLength: [6, "Password should be greater than 6 characters"],
    select : false
  },
  phone: {
    type: String,
    sparse:true,
    unique: true,
    minLength: [10, "must be 10 digits"],
    maxLength: [10, "not more than 10 digits"],
  },
  bio: {
    type: String,
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },

  photoUrl : {   // Google image
    type : String
  },

  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },

  // Calculated at backend

  state: {
    type: String,
  },
  city: {
    type: String,
  },

  intrest: {
    // used for recomandations
    recentViews: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    fav: [
      {
        category: String,
      },
    ],
    userType: {
      // Rich, avg, poor
      type: String,
    },
    avgBudget: {
      type: Number,
    },
  },

  userData: {
    no_of_items_sold: Number,
    no_of_items_purchase: Number,

    sold_items: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],

    purchased_items: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
  },

  // updated at backend
  sellItems: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
  ],
  buy_items: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
  ],
  cart: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: String,
  resetPasswordExpiry: Date,
});

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
