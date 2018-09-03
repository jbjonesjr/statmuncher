let YahooFantasy = require('yahoo-fantasy')
let au = require('./lib/auth-utils')

require('dotenv').config()


var yf = new YahooFantasy(
  process.env.yahoo_consumer_key,
  process.env.yahoo_app_secret
)

let access_token = process.env.access_token
let refresh_token = process.env.refresh_token

let main = function () {
  yf.setUserToken(
    access_token
  )
  yf.players.leagues(['nfl.l.1084232'], (err, data) => {
    if (err) {
      return au.refresh(err, refresh_token).then(({access_token, refresh_token}) => {
        yf.setUserToken(access_token)
        main();
      }, (reason) => {
        console.log(reason)
      })
    }

    console.log(data)
  })
}

main()
