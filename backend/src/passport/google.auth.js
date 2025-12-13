import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import asyncHandler from "express-async-handler";
import passport from "passport";
import { ENV } from "../config/env.config.js";
import { prisma } from "../config/prisma.config.js";

//get the user from the GoogleStrategy
passport.serializeUser((user, done) => {
  console.log("Inside Serialize User", user);
  // Make sure user has user_id
  if (!user.user_id) return done(new Error("User missing user_id"));
  done(null, user.user_id);
});


passport.deserializeUser(async (id, done) => {
  if (!id) {
    console.error("deserializeUser called with undefined id");
    return done(new Error("No user ID provided"), null);
  }

  try {
    const findUser = await prisma.user.findUnique({ where: { user_id: id } });
    return done(null, findUser || null);
  } catch (err) {
    console.error(err);
    return done(err, null);
  }
});


export default passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: ENV.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: false,
      proxy: true,
    },
    //profile is the user object
    asyncHandler(async function (accessToken, refreshToken, profile, done) {
      try {
        console.log("profile:", profile);

        const findUser = await prisma.user.findFirst({
          where: { user_googleID: profile.id },
        });

        if (!findUser) {
          console.log("Creating new user...");
          const newUser = await prisma.user.create({
            data: {
              user_email:
                profile.emails?.[0]?.value ||
                `${profile.id}@google.placeholder`,
              user_firstName: profile.name?.givenName || null,
              user_lastName: profile.name?.familyName || null,
              user_fullName:
                profile.displayName ||
                `${profile.name?.givenName || ""} ${
                  profile.name?.familyName || ""
                }`.trim() ||
                null,
              user_profileImage: profile.photos?.[0]?.value || undefined,
              user_username: (
                profile.emails?.[0]?.value || `user_${profile.id}`
              ).split("@")[0],
              user_phoneNumber: null,
              user_password: null,
              user_googleID: profile.id,
              user_authProvider: "google",
              user_points: 0,
            },
          });
          console.log("New user created:", newUser);
          return done(null, newUser);
        }

        //if user is found
        console.log("User found:", findUser);
        return done(null, findUser);
      } catch (error) {
        console.error("Google auth error:", error);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        return done(error, null);
      }
    })
  )
);
