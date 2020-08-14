const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db.js");

const router = new express.Router();


/** 
    GET /invoices
    Return info on invoices: like {invoices: [{id, comp_code}, ...]}
*/

router.get("/", async function (req, res, next) {
	try {
		const results = await db.query(
			`SELECT id, comp_code
            FROM invoices`);

		let invoices = results.rows;
		return res.json({ invoices });
	} catch (err) {
		return next(err);
	}
})

/**
    GET /invoices/[id]
    Returns obj on given invoice.
    If invoice cannot be found, returns 404.
    Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} 
 */

router.get("/:id", async function (req, res, next) {
	try {
		let id = req.params.id;

		const iResult = await db.query(
			`SELECT id, comp_code, amt, paid, add_date, paid_date
            FROM invoices
            WHERE id = $1`,
			[id]
		);

		const invoice = iResult.rows[0];
		let comp_code = invoice.comp_code;

		const cResult = await db.query(
			`SELECT code, name, description
            FROM companies
            WHERE code = $1`,
			[comp_code]
		);
		if (invoice === undefined) throw new NotFoundError();
		const company = cResult.rows[0];
		invoice.company = company;
		return res.json({ invoice });
	} catch (err) {
		return next(err);
	}
});

/**
    POST /invoices
    Adds an invoice.
    Needs to be passed in JSON body of: {comp_code, amt}
    Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post("/", async function (req, res, next) {
	try {
		const { comp_code, amt } = res.body;
		const result = await db.query(
			`INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[comp_code, amt],
		);
		const invoice = result.rows[0];
		return res.status(201).json({ invoice });
	} catch (err) {
		return next(err);
	}
});

/**
    PUT /invoices/[id]
    Updates an invoice.
    If invoice cannot be found, returns a 404.
    Needs to be passed in a JSON body of {amt}
    Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res, next) {
	try {
		const amt = req.body.amt;
		const id = req.params.id;
		const result = await db.query(
			`UPDATE invoices
            SET amt = $1
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[amt, id],
		);
		const invoice = result.rows[0];
		if (invoice === undefined) throw new NotFoundError();
		return res.json({ invoice });
	} catch (err) {
		return next(err);
	}
});

/**
    DELETE /invoices/[id]
    Deletes an invoice.
    If invoice cannot be found, returns a 404.
    Returns: {status: "deleted"}
 */
router.delete("/:id", async function (req, res, next) {
	try {
		const id = req.params.id;

		const result = await db.query(
			`DELETE FROM invoices
            WHERE id = $1
            RETURNING id`,
			[id],
		);
// FIX THIS
		if (result.rowCount === 0) throw new NotFoundError();

		return res.json({ status: "Deleted" });
	} catch (err) {
		return next(err);
	}
});







module.exports = router;