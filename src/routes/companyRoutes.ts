import express from "express";
import isAuth from "../middleware/isAuth";

import * as CompanyController from "../controllers/CompanyController";

const companyRoutes = express.Router();

companyRoutes.get("/companies/list", isAuth, CompanyController.list);
companyRoutes.get("/companies", isAuth, CompanyController.index);

companyRoutes.get("/companies/:id", isAuth, CompanyController.show);

companyRoutes.post("/companies", isAuth, CompanyController.store);

companyRoutes.put("/companies/:id", isAuth, CompanyController.update);

companyRoutes.put(
  "/companies/:id/schedules",
  isAuth,
  CompanyController.updateSchedules
);

companyRoutes.delete("/companies/:id", isAuth, CompanyController.remove);

companyRoutes.patch(
  "/companies/archived/:id",
  isAuth,
  CompanyController.updateArchived
);

export default companyRoutes;
