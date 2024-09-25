import express from "express";
const router = express.Router();
import { protocoloAnuncioController } from "../controller/protocoloAnuncioController.js";

//add a product
router.post("/", protocoloAnuncioController.create);
router.put("/", protocoloAnuncioController.update);
router.get("/:codigo", protocoloAnuncioController.get);
router.put("/update/:codigo", protocoloAnuncioController.updateAnuncio);
router.delete("/:codigo", protocoloAnuncioController.doDelete);

// //add images to a product
// router.post("/imagens_produto/:id", doEnviarImagensProdutoById);

// //get all last products create
// router.get("/ultimos_produtos", doGetAnuncioB2B);

const anuncioRoutes = router;
export { anuncioRoutes };
