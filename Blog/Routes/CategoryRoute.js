import express from "express";
import CategoryController from "../Controllers/CategoryController.js";

var router = express.Router();

router.post("/create", CategoryController.create);
router.get("/get", CategoryController.get);
router.put("/update/:id", CategoryController.update);
router.delete("/delete/:id", CategoryController.Cdelete);

const CategoryRoutes = router;
export default CategoryRoutes