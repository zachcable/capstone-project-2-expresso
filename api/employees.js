const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const employeeRouter = express.Router();
const timesheetRouter= require('./timesheet');

//set up for routes with /:employeeId/
employeeRouter.param('employeeId', (req, res, next, employeeId)=>{
  db.get(`SELECT * FROM Employee WHERE id = $employeeId`, {$employeeId: employeeId}, (err, row)=>{
    if(err){
      next(err);
    }else if (row){
      req.employee = row;
      next();
    }else{
      res.sendStatus(404);
    }
  });
});

//validate new employee data
const validateEmployee = function(req,res,next){
  if(
    !req.body.employee.name ||
    !req.body.employee.position ||
    !req.body.employee.wage
  ){
    res.sendStatus(400);
  }else{
    next();
  }
};

//basic get on /api/employees
employeeRouter.get('/', (req, res, next)=>{
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, rows)=>{
    if(err){
      next(err);
    }else {
      res.status(200).json({employees:rows});
    }
  });
});

//get specific employee on /api/employees/:employeeId
employeeRouter.get('/:employeeId', (req,res,next)=>{
  res.status(200).json({employee:req.employee});
});

//basic post on /api/employees
employeeRouter.post('/', validateEmployee, (req, res, next)=>{
  const isCurrentEmployee = req.body.employee.isCurrentEmployee ===0 ? 0: 1;
  db.run(`INSERT INTO Employee (name, position, wage, is_current_employee)
          VALUES ($name, $position, $wage, $isCurrentEmployee)`,
        {
          $name:req.body.employee.name,
          $position:req.body.employee.position,
          $wage:req.body.employee.wage,
          $isCurrentEmployee:isCurrentEmployee
        }, function(err){
          if(err){
            next(err);
          }else {
            db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`,(err,row)=>{
              res.status(201).json({employee:row});
            });
          }
        }
      );
});

//update employee information on /api/employees/:employeeId
employeeRouter.put('/:employeeId', validateEmployee, (req, res, next)=>{
    const isCurrentEmployee = req.body.employee.isCurrentEmployee ===0 ? 0: 1;
    db.run(`UPDATE Employee SET name=$name, position=$position, wage=$wage,
      is_current_employee=$isCurrentEmployee WHERE id=$employeeId`,
    {
      $name:req.body.employee.name,
      $position:req.body.employee.position,
      $wage:req.body.employee.wage,
      $isCurrentEmployee:isCurrentEmployee,
      $employeeId:req.params.employeeId
    },
    (err)=>{
      if(err){
        next(err);
      }else{
        db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, row)=>{
          res.status(200).json({employee:row});
        });
      }
    });
});

//delete route, makes employee not currently employed, on /api/employees/:employeeId
employeeRouter.delete('/:employeeId', (req,res,next)=>{
  db.run(`UPDATE Employee SET is_current_employee=0 WHERE id = ${req.params.employeeId}`,(err)=>{
    if(err){
      next(err);
    }else{
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,(err,row)=>{
        if(err){
          next(err);
        }else{
          res.status(200).json({employee:row});
        }
      });
    }
  });
});

//deal with timesheets for /api/employees/:employeeID/timesheets
employeeRouter.use('/:employeeId/timesheets', timesheetRouter);


module.exports = employeeRouter;
