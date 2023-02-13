import express from "express";
import CurrencyPreferenceController from "../Controllers/CurrencyPreferenceController.js";
import Authenticate from "../Middleware/Authenticate.js";

var router = express.Router();

// Define Routes Below
router.get("/get", Authenticate, CurrencyPreferenceController.get_Preference);
router.put("/update", Authenticate, CurrencyPreferenceController.update_Preference);

export const CurrencyPreferenceRoutes = router;
