const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db.js");

const router = new express.Router();

/**
 * Returns list of companies, like {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT code, name, description
      FROM companies`
    );
    const companies = results.rows;
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
})

/**
 * Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, this should return a 404 status response.
 */
router.get("/:code", async function (req, res, next) {
  try {
    const comp_code = req.params.code;
    const cResult = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [comp_code]
    );

    const iResults = await db.query(
      `SELECT id
      FROM invoices
      WHERE comp_code = $1`,
      [comp_code]
    );

    const company = cResult.rows[0];
    if (company === undefined) throw new NotFoundError();
    const invoices = iResults.rows.map(invoice => invoice.id);
    company.invoices = invoices;
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});


/** 
 * Adds a company
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
*/
router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description]
    );
    // console.log("this is result:", result);
    const company = result.rows[0];
    // console.log("this is company:", company);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * Edit existing company.
 * Should return 404 if company cannot be found.
 * Needs to be given JSON like: {name, description}
 * Returns update company object: {company: {code, name, description}}
 */
router.put("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies
      SET name=$2, description=$3
      WHERE code = $1
      RETURNING code, name, description`,
      [code, name, description]
    );
    if (result.rowCount === 0) throw new NotFoundError();
    const company = result.rows[0];
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * Deletes company.
 * Should return 404 if company cannot be found.
 * Returns {status: "deleted"}
 */
router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM companies
      WHERE code = $1
      RETURNING code`,
      [req.params.code]
    );
    if (result.rowCount === 0) throw new NotFoundError();
    return res.json({ status: "Deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;