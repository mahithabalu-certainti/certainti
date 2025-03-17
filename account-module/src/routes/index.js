const { Router } = require("express");
const accountRoutes = require('./accountRoutes');

const routes = Router();

routes.use('/accounts', accountRoutes);

module.exports = routes;
