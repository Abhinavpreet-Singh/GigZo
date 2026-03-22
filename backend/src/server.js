import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";
<<<<<<< HEAD
import { initializeFirebaseAdmin } from "./config/firebase.js";

const PORT = process.env.PORT || 5000;

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    throw new Error(`${key} is required in environment variables.`);
  }
}

initializeFirebaseAdmin();

=======

const PORT = process.env.PORT || 5000;

>>>>>>> e4d510c (Implement user profile module with schema, controller, and routes)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.log(err));