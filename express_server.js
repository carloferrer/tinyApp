const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 8080;

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let templateVars = {};

function generateRandomString() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for(var i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return text;
}

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .use(cookieParser())

  .post('/register', (req, res) => {
    let proceed = true;

    if (!req.body.email) {
      res.statusCode = 400;
      res.send('Email field empty.');
      console.log("Email field empty.");
      proceed = false;
    }

    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        res.statusCode = 400;
        res.send('Email already registered.');
        console.log("Email already registered.");
        proceed = false;
      }
    }

    if (proceed) {
      let newUserID = generateRandomString();

      users[newUserID] = {
        'id': newUserID,
        'email': req.body.email,
        'password': req.body.password
      };

      res.cookie('userID', newUserID);
      res.redirect('/urls');
    }
  })

  .get('/register', (req, res) => {
    res.render('urls_register');
  })

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