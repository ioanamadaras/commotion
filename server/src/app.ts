import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
require("dotenv").config();

import userRoute from "./api/routes/userRoutes";
import boardRoute from "./api/routes/boardRoutes";
import teamRoute from "./api/routes/teamRoutes";

const app = express();

// middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: "http://localhost:5001", credentials: true })); //allow requests from the frontend which is running on port 5001 and allow credentials (cookies, authorization headers, etc.)
app.use(express.json()); // Permite să citești req.body ca JSON.

// routes
app.get("/", (req, res) => res.send("Welcome to Commotion API"));
app.use("/user", userRoute);
app.use("/board", boardRoute);
app.use("/team", teamRoute);

// start server and connect to db
mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.MONGO_URI ?? "")
    .then(() => app.listen(process.env.PORT)) // listen for requests
    .then(() =>
        console.log(`Server running on http://localhost:${process.env.PORT}`),
    )
    .catch((err) => console.log(err)); // catch errors
