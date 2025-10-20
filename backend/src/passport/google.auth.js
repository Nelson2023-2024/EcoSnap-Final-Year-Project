import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import asyncHandler from "express-async-handler";
import passport from "passport";
import { ENV } from "../config/env.config.js";
import { User } from "../models/User.model.js";

//get the user from the GoogleStrategy
passport.serializeUser((user, done) => {
  console.log("Inside Serialize User");
  console.log("User from serialize User", user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const findUser = await User.findById(id);
    return findUser ? done(null, findUser) : done(null, null);
  } catch (error) {
    done(err, null);
  }
});

export default passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: ENV.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    //profile is the user object
    asyncHandler(async function (accessToken, refreshToken, profile, done) {
      console.log("profile:", profile);
      const findUser = await User.findOne({ googleID: profile.id });

      if (!findUser) {
        const newUser = await User.create({
          email: profile.emails?.[0]?.value || "",
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          fullName:
            profile.displayName ||
            `${profile.name?.givenName || ""} ${
              profile.name?.familyName || ""
            }`,
          profileImage: profile.photos?.[0]?.value || "",
          username: (profile.emails?.[0]?.value || "").split("@")[0],
          phoneNumber: "",
          password: "",
          googleID: profile.id,
          authProvider: "google",
          points: 0,
        });
        return done(null, newUser);
      }

      //if user is found
      return done(null, findUser);
    })
  )
);
