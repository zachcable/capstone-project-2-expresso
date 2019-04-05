const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const morgan = require('morgan');
const cors = require('cors');
const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 4000;
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api',apiRouter);

app.use(errorHandler());


app.listen(PORT, ()=>{
  console.log(`Server listening on ${PORT}`);
});

module.exports=app;
