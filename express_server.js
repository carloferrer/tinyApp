const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 8080;

const users = {
  "a": {
    id: "ADMINISTRATOR",
    email: "a@a",
    password: bcrypt.hashSync('a', 10)
  },
  "b": {
    id: "ADMINISTRATOR-2",
    email: "b@b",
    password: bcrypt.hashSync('b', 10)
  }

};

let urlDatabase = {
  'ADMINISTRATOR' : {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  },
  'ADMINISTRATOR-2' : {
    "a2a2a2": "http://www.facebook.com",
    "b3b3b3": "http://www.reddit.com"
  }
};

let templateVars = {};
let loggedAsEmail = ''; // This stores the logged in user's email.
let uniqueURLs ={}; // This object is populated with the URLs that belong to the user that is logged in.

app
  .use(bodyParser.urlencoded( {
    extended: true
  }))

  .use(cookieSession({
    name: 'session',
    keys: ['this_is_my_key']
  }))

// REGISTER
// ***** ***** ***** ***** *****
  .get('/register', (req, res) => {
    if (loggedAsEmail) {
      res.status(403).send('You are already logged in.  Please log out to register a new email!');
      return;
    }

    res.render('urls_register');
  })

  .post('/register', (req, res) => {
    if (!req.body.email) {
      res.status(400).send('The email field may not be empty.');
      return;
    } else if (!req.body.password) {
      res.status(400).send('The password field may not be empty.');
      return;
    }

    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        res.status(400).send('This email already registered.');
        return;
      }
    }

    let newUserID = generateRandomString();

    users[newUserID] = {
      'id': newUserID,
      'email': req.body.email,
      'password': bcrypt.hashSync(req.body.password, 10)
    };

    urlDatabase[newUserID] = {}; // Initialize new object for newly registered user to store URLs

    res.redirect('/urls');
  })

// ***** ***** ***** ***** *****


// LOG IN
// ***** ***** ***** ***** *****
  .get('/login', (req, res) => {
    if (loggedAsEmail) {
      res.status(403).send('You are already logged in.  Please log out to log in!');
      return;
    }

    res.render('urls_login');
  })

  .post('/login', (req, res) => {
    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        if (bcrypt.compareSync(req.body.password, users[currentUser]['password'])) {

          req.session.userID = users[currentUser]['id']; // Generate cookie.
          loggedAsEmail = users[currentUser]['email']; // Remember who's logged in.
          uniqueURLs = urlDatabase[users[currentUser]['id']]; // Only let this user see the URLs the user owns.

          res.redirect('/urls');
          return;

        } else {
          res.status(403).send('Password is incorrect.');
          return;
        }
      }
    }

    res.status(403).send('Email not found; please check the spelling of the email address input.  Otherwise, register with TinyApp!');
    return;
  })
// ***** ***** ***** ***** *****

// LOGOUT
// ***** ***** ***** ***** *****
  .post('/logout', (req, res) => {
    req.session = null; // destroys session and clears cookies

    console.log('Logged out. Cookie cleared.');
    loggedAsEmail = '';
    res.redirect('/urls');
  })
// ***** ***** ***** ***** *****

// REDIRECT FROM SHORT URL TO LONG URL
// ***** ***** ***** ***** *****
  .get('/u/:shortURL', (req, res) => {
    let longURL = '';

    for (let uniqueUser in urlDatabase) {
      for (let short in urlDatabase[uniqueUser]) {
        if (req.params.shortURL === short) {
          longURL = urlDatabase[uniqueUser][short];
          res.redirect(longURL);
        }
      }
    }

    res.status(404).send('There is no URL associated with this shortURL!');
  })
// ***** ***** ***** ***** *****

// UPDATE A SHORT URL
// ***** ***** ***** ***** *****
  .get('/urls/:id/update', (req, res) => {
    if (!loggedAsEmail) {
      res.status(403).send('You must be logged in to edit shortURLs!');
      return;
    } else if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot edit shortURLs that you do not own!');
      return;
    }

    templateVars = {
      urls: uniqueURLs,
      shortURL: req.params.id,
      loggedAsEmail: loggedAsEmail
    };

    res.render('urls_show', templateVars);
  })

  .get('/urls/:id', (req, res) => {
    if (req.params.id === 'new') {
      templateVars = {
        urls: uniqueURLs,
        loggedAsEmail: loggedAsEmail
      };

      res.render('urls_new', templateVars);
    } else {
      res.redirect(`/urls/${req.params.id}/update`);
    }
  })

  .post('/urls/:id/update', (req, res) => {
    if (!loggedAsEmail) {
      res.status(403).send('You must be logged in to edit shortURLs!');
      return;
    } else if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot edit shortURLs that you do not own!');
      return;
    } else {
      uniqueURLs[req.params.id] = req.body.inputURL;
    }

    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };

    res.render('urls_index', templateVars);
  })
// ***** ***** ***** ***** *****

// DELETE A URL
// ***** ***** ***** ***** *****
  .post('/urls/:id/delete', (req, res) => {
    if (!loggedAsEmail) {
      res.status(403).send('You must be logged in to delete shortURLs!');
      return;
    } else if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot delete shortURLs that you do not own!');
      return;
    }

    delete uniqueURLs[req.params.id];

    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };

    res.render('urls_index', templateVars);
  })
// ***** ***** ***** ***** *****

// GENERATE NEW SHORTURLS!
// ***** ***** ***** ***** *****
  .get('/urls/new', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };
    res.render('urls_new', templateVars);
  })

  .post('/urls', (req, res) => {
     if (!loggedAsEmail) {
      res.status(403).send('You must be logged in to generate shortURLs!');
      return;
    }

    uniqueURLs[generateRandomString()] = req.body.longURL;
    res.redirect('/urls');
  })
// ***** ***** ***** ***** *****

// LOAD INDEX PAGE
// ***** ***** ***** ***** *****
  .get('/urls', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };
    res.render('urls_index', templateVars);
  })

  .get('/', (req, res) => {
    res.redirect('/urls');
  })

// APPEND
// ***** ***** ***** ***** *****
  .set('view engine', 'ejs')

  .listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });

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