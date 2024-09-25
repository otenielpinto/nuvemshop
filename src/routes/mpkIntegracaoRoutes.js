import express from "express";
const router = express.Router();
import { mpkIntegracaoController } from "../controller/mpkIntegracaoController.js";

//add ecommerce
router.post("/", mpkIntegracaoController.create);

const mpkIntegracaoRoutes = router;
export { mpkIntegracaoRoutes };
