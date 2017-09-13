const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

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
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for(var i = 0; i < LENGTH; i++) {
      text += CHARS.charAt(Math.floor(Math.random() * CHARS.LENGTH));
  }
  return text;
}

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .use(cookieParser())

  .post('/logout', (req, res) => {
    res.clearCookie('username');

    // templateVars = {
    //   urls: urlDatabase,
    //   username: req.cookies['username']
    // };

    // res.render('urls_index', templateVars);

    res.redirect('/urls');
  })

  .post('/login', (req, res) => {
    let username = req.body.username;
    res.cookie('username',username);

    templateVars = {
      urls: urlDatabase,
      username: username
    };

    res.render('urls_index', templateVars);
  })

  .get('/u/:shortURL', (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  })

  .post('/urls/:id/update', (req, res) => {
    urlDatabase[req.params.id] = req.body.inputURL;

    templateVars = {
      urls: urlDatabase,
      username: req.cookies['username']
    };

    res.render('urls_index', templateVars);
  })

  .post('/urls/:id/delete', (req, res) => {
    delete urlDatabase[req.params.id];
    templateVars = {
      urls: urlDatabase,
      username: req.cookies['username']
    };
    res.render('urls_index', templateVars);
  })

  .get('/urls/new', (req, res) => {
    res.render('urls_new');
  })

  .post('/urls', (req, res) => {
    console.log(req.body); // debug statement to see POST parameters
    res.send('OK'); // respond w/ OK (to be replaced)
  })

  .get('/urls', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      username: req.cookies['username']
    };
    res.render('urls_index', templateVars);
  })

  .get('/urls/:id', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      username: req.cookies['username']
    };
    res.render('urls_show', templateVars);
  })

  .set('view engine', 'ejs')

  .listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });