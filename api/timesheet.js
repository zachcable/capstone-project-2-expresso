const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const timesheetRouter = express.Router({mergeParams: true});

//set up for routes with /:timesheetId/
timesheetRouter.param('timesheetId',(req,res,next,timesheetId)=>{
  db.get(`SELECT * FROM Timesheet WHERE id =${timesheetId}`,(err,row)=>{
    if(err){
      next();
    }else if (row){
      req.timesheet=row;
      next();
    }else{
      res.sendStatus(404);
    }
  });
});

//validate new timesheets
const validateTimesheet = function(req,res,next){
  if(
    !req.body.timesheet.hours ||
    !req.body.timesheet.rate ||
    !req.body.timesheet.date
  ){
    res.sendStatus(400);
  }else{
    next();
  }
};

//basic get on timesheets on /api/employees/:employeeId/timesheets
timesheetRouter.get('/',(req, res, next)=>{
  db.all(`SELECT * FROM Timesheet WHERE employee_id=$employeeId`,
  {
    $employeeId:req.params.employeeId
  },
  (err, rows)=>{
    if(err){
      next(err);
    }else{
      res.status(200).json({timesheets:rows});
    }
  });
});

//basic post on timesheets on /api/employees/:employeeId/timesheets
timesheetRouter.post('/', validateTimesheet, (req, res, next)=>{
  db.get(`SELECT * FROM Employee WHERE id=${req.params.employeeId}`,(err,row)=>{
    if(err){
      next(err);
    }else if(!row){
      res.sendStatus(404);
    }else{
      //used broken up db parts to ease reading
      const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
      VALUES ($hours, $rate, $date, $employeeId)`;
      const values = {
        $hours:req.body.timesheet.hours,
        $rate:req.body.timesheet.rate,
        $date:req.body.timesheet.date,
        $employeeId:req.params.employeeId
      };
      db.run(sql, values, function(err){
        if(err){
          next(err);
        }else{
          db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (err,row)=>{
            res.status(201).json({timesheet:row});
          });
        }
      });
    }
  });
});

//update specific timesheet on /api/employees/:employeeId/timesheets/:timesheetId
timesheetRouter.put('/:timesheetId', validateTimesheet, (req,res,next)=>{
  db.get(`SELECT * FROM Employee WHERE id=${req.params.employeeId}`,(err,row)=>{
    if(err){
      next(err);
    }else if(!row){
      res.sendStatus(404);
    }else{
      //used broken up db parts to ease reading
      const sql = `UPDATE Timesheet SET hours=$hours, rate=$rate, date=$date WHERE id=$id`;
      const values = {
        $hours:req.body.timesheet.hours,
        $rate:req.body.timesheet.rate,
        $date:req.body.timesheet.date,
        $id:req.params.timesheetId
      };
      db.run(sql, values, (err)=>{
        if(err){
          next(err);
        }else{
          db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err,row)=>{
            res.status(200).json({timesheet:row});
          });
        }
      });
    }
  });
});

//delete a timesheet on /api/employees/:employeeId/timesheets/:timesheetId
timesheetRouter.delete('/:timesheetId',(req,res,next)=>{
  db.run(`DELETE FROM Timesheet WHERE id= ${req.params.timesheetId}`,(err)=>{
    if(err){
      next(err);
    }else{
      res.sendStatus(204);
    }
  });
});


module.exports = timesheetRouter;
