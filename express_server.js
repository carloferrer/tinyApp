const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
}

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .get('/u/:shortURL', (req, res) => {
    res.redirect(longURL);
  })

  .get('/urls/new', (req, res) => {
    res.render('urls_new');
  })

  .post('/urls', (req, res) => {
    console.log(req.body); // debug statement to see POST parameters
    res.send('OK'); // respond w/ OK (to be replaced)
  })

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