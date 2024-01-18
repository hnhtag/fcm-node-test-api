const express = require('express')
const cors = require('cors')

const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// enable cors
app.use(cors())

// INDEX route
app.get('/', (req, res, next) => {
  return res.status(200).json({ message: 'Hello there!' })
})

// api route
app.use('/api/fcm', require('./api/fcm'))

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers
app.use(function (err, req, res, next) {
  console.log(err.stack);
  return res.status(err.status || 500).json({
    error: err.message,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app;

