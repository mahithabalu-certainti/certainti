const { Router } = require("express");
const controller = require("../controllers/index.controller");

const routes = Router();

routes.get("/", controller.accountController.accounts);

module.exports = routes;
