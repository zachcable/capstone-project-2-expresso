const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuRouter = express.Router();
const menuitemRouter = require('./menuitem');

//set up for routes with /:menuId
menuRouter.param('menuId', (req,res,next,menuId)=>{
  db.get(`SELECT * FROM Menu where id = ${menuId}`,(err,row)=>{
    if(err){
      next(err);
    }else if(row){
      req.menu=row;
      next();
    }else{
      res.sendStatus(404);
    }
  });
});

//validate new menus, in case future menus have more properties
const validateMenu=function(req,res,next){
  if(!req.body.menu.title){
    res.sendStatus(400);
  }else{
    next();
  }
};

//get all menus
menuRouter.get('/',(req,res,next)=>{
  db.all(`SELECT * FROM Menu`, (err,rows)=>{
    if(err){
      next(err);
    }else{
      res.status(200).json({menus:rows});
    }
  });
});

//get specific menu
menuRouter.get('/:menuId',(req,res,next)=>{
  res.status(200).json({menu:req.menu});
});

//create new menu on /api/menus
menuRouter.post('/', validateMenu, (req,res,next)=>{
  db.run(`INSERT INTO Menu (title) VALUES ($title);`, {$title:req.body.menu.title},function(err){
    if(err){
      next(err);
    }else{
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID};`, (err,row)=>{
        res.status(201).json({menu:row});
      });
    }
  });
});

//update menu on /api/menu/:menuId
menuRouter.put('/:menuId', validateMenu, (req,res,next)=>{
  db.run(`UPDATE Menu SET title=$title WHERE id=$id`,
    {
      $title:req.body.menu.title,
      $id:req.params.menuId
    },
    (err)=>{
      if(err){
        next(err);
      }else {
        db.get(`SELECT * FROM Menu WHERE id=${req.params.menuId}`, (err,row)=>{
          res.status(200).json({menu:row});
        });
      }
  });
});

//delete menu on /api/menus/:menuId
menuRouter.delete('/:menuId',(req,res,next)=>{
  db.get(`SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`,(err,row)=>{
    if(err){
      next(err);
    }else if(row){
      res.sendStatus(400);
    }else{
      db.run(`DELETE FROM Menu WHERE id=${req.params.menuId}`, (err)=>{
        if(err){
          next(err);
        }else {
          res.sendStatus(204);
        }
      });
    }
  });
});

menuRouter.use('/:menuId/menu-items', menuitemRouter);

module.exports = menuRouter;
