import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import "./database";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";
import { messageQueue } from "./queues/messages";
import { sendScheduledMessages } from "./queues/schedules";
import { wbotQueue } from "./queues/wbot";
import { contactQueue } from "./queues/contacts";

import uploadConfig from "./config/upload";

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.set("queues", {
  messageQueue,
  sendScheduledMessages,
  wbotQueue,
  contactQueue
});


app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);
app.use(express.json());
app.use(Sentry.Handlers.requestHandler());
app.use("/public", express.static(uploadConfig.directory));
app.get('/healthcheck', (_, res) => {
  return res.json({
    message: 'health check'
  })
})
app.use(routes);

app.use(Sentry.Handlers.errorHandler());

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
