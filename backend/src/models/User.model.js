import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // URL to profile picture
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      trim: true,
    },
    points: {
      type: Number,
      trim: true,
      default: 0,
    },
    //Used to search for the user safely
    googleID: {
      type: String,
      unique: true,
      trim: true,
      sparse: true
    },
    authProvider: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "collector"],
      default: "user",
    },
    // Now, a user can be assigned to multiple teams
    assignedTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
  },

  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);