const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuitemRouter = express.Router({mergeParams: true});

//set up for routes with /:menuItemId
menuitemRouter.param('menuItemId', (req,res,next,menuItemId)=>{
  db.get(`SELECT * FROM MenuItem where id=${menuItemId}`,(err,row)=>{
    if(err){
      next(err);
    }else if (row){
      req.menuitem=row;
      next();
    }else{
      res.sendStatus(404);
    }
  });
});

//validate new menu items
const validateItem = function(req,res,next){
  if(
    !req.body.menuItem.name ||
    !req.body.menuItem.inventory ||
    !req.body.menuItem.price
  ){
    res.sendStatus(400);
  }else{
    next();
  }
};

//get all menu items from a menu on /api/menus/:menuId/menu-items
menuitemRouter.get('/', (req,res,next)=>{
  db.all(`SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`,(err,rows)=>{
    if(err){
      next(err);
    }else{
      res.status(200).json({menuItems:rows});
    }
  });
});

//create new menuItems
menuitemRouter.post('/',validateItem,(req,res,next)=>{
  const description = req.body.menuItem.description || "";
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
  VALUES ($name, $description, $inventory, $price, $menuId)`;
  const values = {
    $name:req.body.menuItem.name,
    $description:description,
    $inventory:req.body.menuItem.inventory,
    $price:req.body.menuItem.price,
    $menuId:req.params.menuId
  };
  db.run(sql,values,function(err){
    if(err){
      next(err);
    }else{
      db.get(`SELECT * FROM MenuItem WHERE id=${this.lastID}`, (err,row)=>{
        res.status(201).json({menuItem:row});
      });
    }
  });
});

//update a menu item
menuitemRouter.put('/:menuItemId',validateItem,(req,res,next)=>{
  const description = req.body.menuItem.description || "";
  const sql = `UPDATE MenuItem SET name=$name, description=$description, inventory=$inventory,
  price=$price, menu_id=$menuId WHERE id=$id`;
  const values = {
    $name:req.body.menuItem.name,
    $description:description,
    $inventory:req.body.menuItem.inventory,
    $price:req.body.menuItem.price,
    $menuId:req.params.menuId,
    $id:req.params.menuItemId
  };
  db.run(sql,values,(err)=>{
    if(err){
      next(err);
    }else{
      db.get(`SELECT * FROM MenuItem WHERE id=${req.params.menuItemId}`,(err,row)=>{
        if(err){
          next();
        }else {
          res.status(200).json({menuItem:row});
        }
      });
    }
  });
});


//delete a menu item
menuitemRouter.delete('/:menuItemId',(req,res,next)=>{
  db.run(`DELETE FROM MenuItem WHERE id=${req.params.menuItemId}`,(err)=>{
    if(err){
      next(err);
    }else{
      res.sendStatus(204);
    }
  });
});
















module.exports=menuitemRouter;
