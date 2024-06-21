import "dotenv/config";

import express from "express";
import http from "http";

import globalRouter from "./global-router";
import { logger } from "./logger";
import { wss } from "./roadmap/roadmap.router";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(logger);
app.use(express.json());
app.use("/api/v1/", globalRouter);

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;

  if (origin === "http://localhost:3000") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
