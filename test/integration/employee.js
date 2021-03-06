/* global expect, chai, agent */
/* jshint expr : true */

const helpers = require('./helpers');

/*
 * The /employees API endpoint
 *
 * This test suite implements full CRUD on the /employees HTTP API endpoint.
 */
describe('(/employees) the employees API endpoint', function () {
  'use strict';

  const numEmployees = 1;

  // custom dates
  let embaucheDate  = new Date('2016-01-01');
  let dob1 = new Date('1987-04-17');
  let dob2 = new Date('1993-04-25');

  // employee we will add during this test suite.
  var employee = {
    code : 'x500',
    display_name : 'Magnus Carolus Charlemagne',
    sexe : 'M',
    dob : dob1,
    date_embauche : embaucheDate,
    nb_spouse : 0,
    nb_enfant : 0,
    grade_id : '9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3',
    daily_salary : 50,
    bank : 'BIAC',
    bank_account : '00-99-88-77',
    email : 'me@info.com',
    fonction_id : 1,
    locked : 0,
    service_id : 1,
    location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
    creditor_group_uuid : 'b0fa5ed2-04f9-4cb3-92f7-61d6404696e7',
    debtor_group_uuid : '4de0fe47-177f-4d30-b95f-cff8166400b4'
  };

  var updateEmployee = {
    code : 'x500',
    display_name : 'Charle Magne De France',
    sexe : 'M',
    dob : dob2,
    date_embauche : embaucheDate,
    nb_spouse : 0,
    nb_enfant : 0,
    grade_id : '9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3',
    daily_salary : 50,
    bank : 'BIAC',
    bank_account : '00-99-88-77',
    email : 'me@info.com',
    fonction_id : 1,
    service_id : 1,
    location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
    creditor_group_uuid : 'b0fa5ed2-04f9-4cb3-92f7-61d6404696e7',
    debtor_group_uuid : '4de0fe47-177f-4d30-b95f-cff8166400b4'
  };

  it('POST /employee should create a new employee', function () {
    return agent.post('/employees')
      .send(employee)
      .then(function (res) {
        helpers.api.created(res);

        employee.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('POST /employee should return a 400 error for an empty object', function () {
    return agent.post('/employees')
      .send({})
      .then(function (res) {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /employees returns a list of all employees', function () {
    return agent.get('/employees')
      .then(function (res) {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('GET /employees/:id should return a specific employee', function () {
    return agent.get('/employees/' + employee.id)
      .then(function (res) {
        var emp = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');

        // add a missing property due to alias in db query
        emp.code = emp.code_employee;
        expect(emp).to.contain.all.keys(employee);
      })
      .catch(helpers.handler);
  });

  it('GET /employees/code/:value should return a list of employees match the employee code token', function () {
    return agent.get('/employees/code/' + String(employee.code).substring(0,1))
      .then(function (res) {
        helpers.api.listed(res, numEmployees);
      })
      .catch(helpers.handler);
  });

  it('GET /employees/display_name/:value should return a list of employees match the employee display_name token', function () {
    return agent.get('/employees/display_name/' + employee.display_name.substring(0,2))
      .then(function (res) {
        helpers.api.listed(res, numEmployees);
      })
      .catch(helpers.handler);
  });

  it('GET /employees/unknown/:value should return an error for an unknown key', function () {
    return agent.get('/employees/unknown/' + employee.display_name.substring(0,2))
      .then(function (res) {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /employees/code/:value should return an empty array for an unmatch value', function () {
    return agent.get('/employees/code/unknown')
      .then(function (res) {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });


  it('PUT /employee/:id should update an existing employee ', function () {
    return agent.put('/employees/' + employee.id)
      .send(updateEmployee)
      .then(function (res) {
        var emp = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(emp).to.be.a('object');
        checkValidUpdate(emp, updateEmployee);
      })
      .catch(helpers.handler);
  });

  it('PUT /employee/:id should not update an existing employee with a fake Id ', function () {
    return agent.put('/employees/fakeId')
      .send(updateEmployee)
      .then(function (res) {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /employee/:id should not update an existing employee with fake fields ', function () {
    return agent.put('/employees/' + employee.id)
      .send({
        code : 'NEW_CODE_X',
        fakeAttribute1: 'fake value 1',
        fakeAttribute2: 'fake value 2'
      })
      .then(function (res) {
        helpers.api.errored(res, 400);
        return agent.get('/employees/' + employee.id);
      })
      .then(function (res) {
        var emp = res.body;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(emp).to.be.a('object');
        checkValidUpdate(emp, updateEmployee);
      })
      .catch(helpers.handler);
  });

  /**
   * @function checkValidUpdate
   * @desc This function test if an updated value returned by the server
   * correspond correctly to the update sended
   * @param {object} emp The employee object to test
   * @param {object} update The correct employee update
   */
  function checkValidUpdate(employee, update) {
    // add a missing property due to alias in db query
    employee.code = employee.code_employee;
    expect(employee).to.contain.all.keys(update);
    for (let i in update) {
      if (i === 'dob' || i === 'date_embauche') {
        expect(new Date(employee[i])).to.equalDate(new Date(update[i]));
      } else {
        expect(employee[i]).to.equal(update[i]);
      }
    }
  }

});
