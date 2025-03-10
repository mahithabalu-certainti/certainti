const { Router } = require("express");
const accountRoutes = require('./account.routes');

const routes = Router();

routes.use('/accounts', accountRoutes);

module.exports = routes;
