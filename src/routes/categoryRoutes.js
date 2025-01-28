import express from "express";
const router = express.Router();
import { categoryController } from "../controller/categoryController.js";

//add a product

router.post("/", categoryController.create);
router.put("/", categoryController.update);
router.get("/all", categoryController.getAll);
router.get("/:codigo", categoryController.get);

router.delete("/:codigo", categoryController.doDelete);

const categoryRoutes = router;
export { categoryRoutes };
