var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app
  .get('/urls', (req, res) => {
    let templateVars = {
      urls: urlDatabase
    };
    res.render('urls_index', templateVars);
  })

  .get('/urls/:id', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id
    };
    res.render('urls_show', templateVars);
  })

  .set('view engine', 'ejs')

  .listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });