import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import os from "os";

import { anuncioRoutes } from "./routes/anuncioRoutes.js";
import { authController } from "./controller/authController.js";
import { authRoutes } from "./routes/authRoutes.js";
import { mpkIntegracaoRoutes } from "./routes/mpkIntegracaoRoutes.js";

dotenv.config();
process.env.TZ = "America/Sao_Paulo";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN }));

//Minhas rotas igual eu faço com o horse
app.get("/health", (req, res) => {
  const healthCheck = {
    status: "UP",
    database: null, // await checkDatabaseConnection() Função que verifica o status do banco de dados
    responseTime: Date.now() - req.startTime,
    version: "1.0.3",
    memoryUsage: {
      total: os.totalmem(),
      used: os.totalmem() - os.freemem(),
    },
    externalService: null, // await checkExternalService()Função que verifica dependências externas
    uptime: process.uptime(),
    date: new Date().toISOString(),
  };
  res.status(200).json(healthCheck);
});

//this for route will need for store front, also for admin dashboard
app.use("/authorization/", authRoutes);
app.use("/ecommerce/", mpkIntegracaoRoutes);
app.use("/anuncio/", authController.validateCredentials, anuncioRoutes);

//app.use("/categoria/", categoriaRoutes);

// Use express's default error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});

export default app;
