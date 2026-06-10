import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
require("dotenv").config();

import userRoute from "./api/routes/userRoutes";
import boardRoute from "./api/routes/boardRoutes";
import { initSocket } from "./socket/index";

export function createApp() {
  const app = express();

  // middleware
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(cors({ origin: [
      "http://localhost:5001",
      "http://192.168.100.88:5001"
  ], credentials: true }));
  app.use(express.json());

  // routes
  app.get("/", (req, res) => res.send("Welcome to Commotion API"));
  app.use("/user", userRoute);
  app.use("/board", boardRoute);

  return app;
}

export async function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  // attach socket.io to the same HTTP server
  initSocket(server);

  // start server and connect to db
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI ?? "");

  return new Promise<void>((resolve) => {
    server.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
      resolve();
    });
  });
}

if (require.main === module) {
  void startServer().catch((err) => console.log(err));
}
