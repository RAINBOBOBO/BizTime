const express = require("express");
const { ExpressError, NotFoundError } = require("../expressError");
const db = require("../db.js");
const { json } = require("express");

const router = new express.Router();

// Returns list of companies, like {companies: [{code, name}, ...]}
router.get("/", async function(req, res, next) {
  try {
    const results = await db.query(
      `SELECT code, name, description
      FROM companies`
    );
    const companies = results.rows;
    return res.json({ companies });
  } catch(err) {
    next(err);
  }
})

// Return obj of company: {company: {code, name, description}}
// If the company given cannot be found, this should return a 404 status response.
router.get("/:code", async function(req, res, next) {
  try {
    const result = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [req.params.code]
    );
    const company = result.rows[0];
    if (company.length === 0) throw new NotFoundError();
    return res.json({ company });
  } catch(err) {
    next(err);
  }
});

// Adds a company
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}
router.post("/", async function(req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING (code, name, description)`,
      [code, name, description]
    );
    const company = result.rows[0];
    return res.status(201).json({ company });
  } catch(err) {
    next(err);
  }
});

// Edit existing company.
// Should return 404 if company cannot be found.
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}
router.put("/:code", async function(req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `UPDATE companies
      SET name=$2, description=$3
      WHERE code = $1
      RETURNING code, name, description`,
      [code, name, description]
    );
    if (result.rows.length === 0) throw new NotFoundError();
    const company = result.rows[0];
    return res.json({ company });
  } catch(err) {
    next(err);
  }
});

// Deletes company.
// Should return 404 if company cannot be found.
// Returns {status: "deleted"}
router.delete("/:code", async function(req, res, next) {
  try {
    await db.query(
      `DELETE FROM companies
      WHERE code = $1`,
      [req.params.code]
    );
    return res.json({status: "deleted"});
  } catch(err) {
    next(err);
  }
});

module.exports = router;