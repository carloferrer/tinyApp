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
  },
  "a": {
    id: "ADMINISTRATOR",
    email: "a@a",
    password: "a"
  }
};

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let templateVars = {};
let loggedAs = '';

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .use(cookieParser())

// REGISTER
// ***** ***** ***** ***** *****
  .post('/register', (req, res) => {
    let proceed = true;

    if (!req.body.email) {
      res.status(400).send('Email field empty.');
      console.log("Email field empty.");
      proceed = false;
    }

    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        res.status(400).send('Email already registered.');
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
    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_register', templateVars);
  })
// ***** ***** ***** ***** *****


// LOG IN
// ***** ***** ***** ***** *****
  .post('/login', (req, res) => {
    let proceed = false;
    let emailFound = false;

    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        emailFound = true;
        if (users[currentUser]['password'] === req.body.password) {
          proceed = true;
          console.log("You've logged in as: ", users[currentUser]['id']);
          loggedAs = users[currentUser]['id'];
          res.cookie('userID', users[currentUser]['id']);
        } else {
          res.status(403).send('Password incorrect.');
        }
      }
    }

    if (!emailFound) {
      res.status(403).send('Email not found');
    }

    if (proceed) {
      res.redirect('/urls');
      // res.send('You logged in!');
    }

  })

  .get('/login', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };

    res.render('urls_login', templateVars);
  })
// ***** ***** ***** ***** *****

// LOGOUT
// ***** ***** ***** ***** *****
  .post('/logout', (req, res) => {
    res.clearCookie('userID');
    loggedAs = '';
    res.redirect('/urls');
  })
// ***** ***** ***** ***** *****

// REDIRECT FROM SHORT URL TO LONG URL
// ***** ***** ***** ***** *****
  .get('/u/:shortURL', (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  })
// ***** ***** ***** ***** *****

// UPDATE A SHORT URL
// ***** ***** ***** ***** *****
  .get('/urls/:id/update', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      loggedAs: loggedAs
    };
    console.log('Attempting to update ' + templateVars['shortURL']);
    res.render('urls_show', templateVars);
  })

  .post('/urls/:id/update', (req, res) => {
    urlDatabase[req.params.id] = req.body.inputURL;

    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };

    res.render('urls_index', templateVars);
  })
// ***** ***** ***** ***** *****

// DELETE A URL
// ***** ***** ***** ***** *****
  .post('/urls/:id/delete', (req, res) => {
    delete urlDatabase[req.params.id];
    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_index', templateVars);
  })
// ***** ***** ***** ***** *****

  .get('/urls/new', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_new', templateVars);
  })

// LOAD INDEX PAGE
// ***** ***** ***** ***** *****
  .get('/urls', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_index', templateVars);
  })
// ***** ***** ***** ***** *****

  .get('/urls/:id', (req, res) => {
    templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_show', templateVars);
  })

// ***** ***** ***** ***** *****
  .post('/urls', (req, res) => {
    console.log(req.body); // debug statement to see POST parameters
    res.send('OK'); // respond w/ OK (to be replaced)
  })

  .set('view engine', 'ejs')

  .listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });
// ***** ***** ***** ***** *****

// RANDOM ID GENERATOR
// ***** ***** ***** ***** *****
function generateRandomString() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for(var i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
// ***** ***** ***** ***** *****