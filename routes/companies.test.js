const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCo;

beforeEach(async function() {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('testco', 'TestCo', 'test description')
    RETURNING code, name, description`);
  testCo = result.rows[0];
  // console.log("this is testCo:", testCo);
});

describe("GET /companies", function() {
  test("Gets a list of all the companies", async function() {
    const resp = await request(app).get(`/companies`);

    expect(resp.body).toEqual({
      companies: [
        {
          code: "testco",
          name: "TestCo",
          description: "test description"
        }
      ]
    });
  });
});

describe("GET /companies/:code", function() {
  test("Get a single company", async function() {
    const resp = await request(app).get(`/companies/testco`);

    expect(resp.body).toEqual({
      "company": {
        "code": "testco",
        "name": "TestCo",
        "description": "test description",
        "invoices": []
      }
    });
  });

  test("Respond with 404 if not found", async function() {
    const resp = await request(app).get(`/companies/not-found`);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /companies", function() {
  test("Create a company", async function() {
    const resp = await request(app)
      .post("/companies")
      .send({code:'testco2', name:'TestCo2', description:'test description2'});
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "company": {
        "code": "testco2",
        "name": "TestCo2",
        "description": "test description2"
      }
    });
  });
});
