var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')

var passport = require('passport')
var request = require('request')
var OAuth2Strategy = require('passport-oauth2')

const conf = {
  client_key: process.env.yahoo_consumer_key,
  client_secret: process.env.yahoo_app_secret
}

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

passport.use(
  new OAuth2Strategy({
    authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
    clientID: 'foooobars',
    // clientID: conf.client_key,
    clientSecret: conf.client_secret,
    callbackURL: 'http://localhost.dev/auth/yahoo/callback'
  }, function (accessToken, refreshToken, params, profile, done) {
    var options = {
      url: `https://social.yahooapis.com/v1/user/${params.xoauth_yahoo_guid}/profile?format=json`,
      method: 'get',
      json: true,
      auth: {
        'bearer': accessToken
      }
    }

    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var userObj = {
          id: body.profile.guiid,
          name: body.profile.nickname,
          avatar: body.profile.image.imageUrl,
          accessToken: accessToken,
          refreshToken: refreshToken
        }

        done.log(JSON.stringify({
          accessToken: accessToken,
          refreshToken: refreshToken
        }))

        return done(null, userObj)
      }
    })
  })
)

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'rebar',
  resave: false,
  saveUninitialized: true
}))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res, user) {
  res.status(200)
  res.send('hello world')
})

// authentication routes
app.get('/auth/yahoo',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function (req, res, user) {
    res.redirect('/')
  })

app.get('/auth/yahoo/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect(req.session.redirect || '/')
  }
)

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect(req.session.redirect || '/')
})

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
    message: err.message,
    error: {}
  })
})

module.exports = app
