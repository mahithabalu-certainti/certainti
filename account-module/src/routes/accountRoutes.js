const { Router } = require("express");
const controller = require("../controllers");

const routes = Router();

routes.get("/", controller.accountController.accounts);

module.exports = routes;
