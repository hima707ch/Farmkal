const express = require("express");
const bodyParse = require("body-parser");
const cors = require("cors");
const User = require("./Models/user");
const fileUpload = require("express-fileupload");

const userRouter = require("./Routers/userRoute");
const productRouter = require("./Routers/productRoute");
const mandiRouter = require("./Routers/mandiRoute");

const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const session = require("express-session");
const configPassport = require("./Middleware/oAuth");

const globalErrorHandler = require("./Controler/errorController");

const app = express();

const clientid =
  "189609013776-3kfq5hlijarvcn4ls1rd7qingld9lk86.apps.googleusercontent.com";
const clientsecret = "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";

// setting cors
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  }),
);

// middleware;
// app.use(bodyParse.urlencoded({ extended: true }));
// app.use(bodyParse.json());
app.use(express.json());
// app.use(fileUpload());

app.use(
  session({
    secret: "YOUR SECRET KEY",
    resave: false,
    saveUninitialized: true,
  }),
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: "https://cr5pww-4000.csb.app/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            photoUrl: profile.photos[0].value,
          });
        }

        console.log(user);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// initial google ouath login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/product",
    failureRedirect: "http://localhost:3000/login",
  }),
);

app.get("/login/sucess", async (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "user Login", user: req.user });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:3000");
  });
});

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", mandiRouter);

app.use(globalErrorHandler);

module.exports = app;

/*
const express = require("express");
const app = express();
const cors = require("cors");

const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const User = require("./Models/user");

const globalErrorHandler = require("./Controler/errorController");

const clientid =
  "189609013776-3kfq5hlijarvcn4ls1rd7qingld9lk86.apps.googleusercontent.com";
const clientsecret = "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";

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  }),
);

// middleware;

app.use(express.json());

app.use(
  session({
    secret: "YOUR SECRET KEY",
    resave: false,
    saveUninitialized: true,
  }),
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: "https://cr5pww-4000.csb.app/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            photoUrl: profile.photos[0].value,
          });
        }

        console.log(user);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// initial google ouath login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/product",
    failureRedirect: "http://localhost:3000/login",
  }),
);

app.get("/login/sucess", async (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "user Login", user: req.user });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:3000");
  });
});

// routes
// app.use("/api/v1", userRouter);
// app.use("/api/v1", productRouter);
// app.use("/api/v1", mandiRouter);

app.use(globalErrorHandler);

module.exports = app;
*/
