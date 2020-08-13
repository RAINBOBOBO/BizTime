/** BizTime express application. */

const express = require("express");
const { NotFoundError } = require("./expressError");
const companiesRoutes = require("./routes/companies");

const app = express();

app.use(express.json());

app.use("/companies", companiesRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  const notFoundError = new NotFoundError();
  return next(notFoundError);
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  // the default status is 500 Internal Server Error
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});


module.exports = app;
