const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('../Models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      callbackURL: "https://cr5pww-4000.csb.app/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Save user information to your database or use it as needed

        let user = await User.findOne({email : profile.emails[0].value});

        if(!user){
            user = await User.create({
                name : profile.displayName,
                email : profile.emails[0].value,
                photoUrl : profile.photos[0].value
            })
        }

        console.log(user);

        return done(null, profile);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        return done(error);
      }
    },
  ),
);

module.exports = passport;
