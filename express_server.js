const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let templateVars = {};

function generateRandomString() {
  // the following is a very simple/elegant solution, however, it lacks the ability to generate capital letters
  // return Math.random().toString(36).substr(2,6);

  const LENGTH = 6;

  let text = "";
  const POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < LENGTH; i++) {
      text += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.LENGTH));
  }
  return text;
}

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .get('/u/:shortURL', (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  })

// *** *** ***
  .get('/urls/new', (req, res) => {
    res.render('urls_new');
  })

  .post('/urls', (req, res) => {
    console.log(req.body); // debug statement to see POST parameters
    res.send('OK'); // respond w/ OK (to be replaced)
  })
// *** *** ***

  .get('/urls', (req, res) => {
    templateVars = {
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