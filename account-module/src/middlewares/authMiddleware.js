const { UNAUTHORIZED, UNAUTHORIZED_MESSAGE } = require("../utils/constant");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(UNAUTHORIZED).json({
      error: UNAUTHORIZED_MESSAGE,
      message: "Invalid token"
    })
  }
  next();
};

module.exports = authMiddleware;