var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
let _ = require('lodash')
var mustacheExpress = require('mustache-express')


require('dotenv').config()

let auth = require('./lib/yahoo_app/app')


const heroku_dynometa_metadata = {
    appId: 'HEROKU_APP_ID',
    appName: 'HEROKU_APP_NAME',
    dynoId: 'HEROKU_DYNO_ID',
    dynoName: 'DYNO',
    slugCommit: 'HEROKU_SLUG_COMMIT',
    slugDescription: 'HEROKU_SLUG_DESCRIPTION',
    releaseCreatedAt: 'HEROKU_RELEASE_CREATED_AT',
    releaseVersion: 'HEROKU_RELEASE_VERSION'
  }

/*const conf = {
  client_key: process.env.yahoo_consumer_key,
  client_secret: process.env.yahoo_app_secret
} */

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.engine('mustache', mustacheExpress())
app.set('view engine', 'mustache')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: true
}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res, user) {
  res.status(200)

  let metadata = _.mapValues(heroku_dynometa_metadata, value => process.env[value])

  res.render('layout', {
    title: 'stats muncher',
    user: req.session.passport
  })
})

app.use(auth)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      title: 'stats muncher',
      user: req.session.passport,
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    title: 'stats muncher',
    user: req.session.passport,
    message: err.message,
    error: {}
  })
})

module.exports = app
