import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
require("dotenv").config();

import userRoute from "./api/routes/userRoutes";
import boardRoute from "./api/routes/boardRoutes";
import teamRoute from "./api/routes/teamRoutes";
import { initSocket } from "./socket/index";

const app = express();

// middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: "http://localhost:5001", credentials: true }));
app.use(express.json());

// routes
app.get("/", (req, res) => res.send("Welcome to Commotion API"));
app.use("/user", userRoute);
app.use("/board", boardRoute);
app.use("/team", teamRoute);

const server = http.createServer(app);

// attach socket.io to the same HTTP server
initSocket(server);

// start server and connect to db
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URI ?? "")
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));