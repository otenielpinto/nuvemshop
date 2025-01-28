import express from "express";
const router = express.Router();
import { productImageController } from "../controller/productImageController.js";

router.post("/:codigo", productImageController.create);
router.put("/:codigo", productImageController.update);
router.get("/:codigo", productImageController.get);
router.delete("/:codigo", productImageController.doDelete);

const productImageRoutes = router;
export { productImageRoutes };
