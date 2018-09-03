modules.export = {
  refresh: function(err, refresh_token) {
    const reason = String(err.description).match( /"(.*?)"/ );

    return new Promise((resolve, reject) => {
      if (reason && 'token_expired' === reason[1]) {
        const options = {
          url: 'https://api.login.yahoo.com/oauth2/get_token',
          method: 'post',
          json: true,
          form: {
            client_id: conf.clientKey,
            client_secret: conf.clientSecret,
            redirect_uri: 'oob',
            refresh_token: refresh_token,
            grant_type: 'refresh_token'
          }
        };

        request(options, function (err, response, { access_token, refresh_token }) {
          console.log(access_token, refresh_token);
          if (err) {
            reject(err);
          }

          redisClient.set('tokenData', JSON.stringify({
            accessToken: access_token,
            refreshToken: refresh_token
            })
          );

          resolve({access_token, refresh_token});
        });
      } else {
        reject(err)
      }
    })
  }
}
