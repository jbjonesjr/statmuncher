var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
let _ = require('lodash')

var passport = require('passport')
var request = require('request')
var OAuth2Strategy = require('passport-oauth2')




let app = module.exports = express()
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
    clientID: conf.client_key,
    clientSecret: conf.client_secret,
    callbackURL: `http://${process.env['HEROKU_APP_NAME']}.herokuapp.com/auth/yahoo/callback`
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

app.get('/auth/logout', function (req, res) {
  req.logout()
  res.redirect(req.session.redirect || '/')
})

module.exports = app
