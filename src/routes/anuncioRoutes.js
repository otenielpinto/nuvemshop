import express from "express";
const router = express.Router();
import { protocoloAnuncioController } from "../controller/protocoloAnuncioController.js";

//add a product
router.post("/", protocoloAnuncioController.create);
router.put("/", protocoloAnuncioController.update);

//precisa ser aqui antes do get /:codigo
router.get("/:codigo", protocoloAnuncioController.get);
router.put("/update/:codigo", protocoloAnuncioController.updateAnuncio);
router.delete("/:codigo", protocoloAnuncioController.doDelete);

const anuncioRoutes = router;
export { anuncioRoutes };
