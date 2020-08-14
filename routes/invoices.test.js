const app = require("../app");
let db = require("../db");
const request  = require("supertest");

let testInvoice;
let testCompany;


beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");

    let cResult = await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ('apple', 'Apple', 'Maker of OSX.')
    RETURNING code, name, description`);

    let iResult = await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, paid_date, add_date)
    VALUES ('apple', 100, FALSE, NULL, CURRENT_DATE)
    RETURNING id, comp_code, amt, paid, paid_date, add_date`);
    testInvoice = iResult.rows[0];
    testCompany = cResult.rows[0];
    testInvoice.company = testCompany;
});

/** GET /invoices - returns `{invoices: [{id, comp_code}, ...]} */

describe("GET /invoices", function() {

    test("Gets a list of 1 invoice", async function () {
        const resp = await request(app).get(`/invoices`);
        expect(resp.body).toEqual({
            invoices: [{id: testInvoice.id, comp_code: testInvoice.comp_code}],
        });
    });
});

describe("GET /invoices:id", function() {

    test("Gets a single invoice", async function() {
        const resp = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(resp.body).toEqual({
            invoice: {
                id: testInvoice.id,
                comp_code: testInvoice.comp_code,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                paid_date: testInvoice.paid_date,
                add_date: expect.any(String),
                company: testInvoice.company
            }
        })
    })
})

