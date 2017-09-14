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
    res.render('urls_register');
  })

  .post('/register', (req, res) => {
    if (!req.body.email) {
      res.status(400).send('The email field may not be empty.');
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
    res.render('urls_login', { loggedAsEmail : loggedAsEmail });
  })

  .post('/login', (req, res) => {
    let emailFound = false;

    for (let currentUser in users) {
      if (users[currentUser]['email'] === req.body.email) {
        emailFound = true;

        if (bcrypt.compareSync(req.body.password, users[currentUser]['password'])) {

          proceed = true;
          console.log("You've logged in as: ", users[currentUser]['email']);

          req.session.userID = users[currentUser]['id']; // Generate cookie.
          loggedAsEmail = users[currentUser]['email']; // Remember who's logged in.
          uniqueURLs = urlDatabase[users[currentUser]['id']]; // Only let this user see the URLs the user owns.

          res.redirect('/urls');
          return;
        } else {
          res.status(403).send('Password is incorrect.');
          return;
        }
      } else {
        res.status(403).send('Email not found; please check the spelling of the email address input.  Otherwise, register with TinyApp!');
        return;
      }
    }
  })
// ***** ***** ***** ***** *****

// LOGOUT
// ***** ***** ***** ***** *****
  .post('/logout', (req, res) => {
    req.session = null; // destroys session and clears cookies

    console.log('Logged out. Cookie cleared. ');
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
        }
      }
    }

    res.redirect(longURL);
  })
// ***** ***** ***** ***** *****

// UPDATE A SHORT URL
// ***** ***** ***** ***** *****
  .get('/urls/:id/update', (req, res) => {
    let proceed = true;

    if (!loggedAsEmail) {
      proceed = false;
      res.status(403).send('You must be logged in to edit shortURLs!');
    } else if (!uniqueURLs[req.params.id]) {
      proceed = false;
      res.status(403).send('You cannot edit shortURLs that you do not own!');
    }

    templateVars = {
      urls: uniqueURLs,
      shortURL: req.params.id,
      loggedAsEmail: loggedAsEmail
    };

    console.log('Attempting to update ' + templateVars['shortURL']);
    if (proceed) {
      res.render('urls_show', templateVars);
    }
  })

  .post('/urls/:id/update', (req, res) => {
    if (!loggedAsEmail) {
      proceed = false;
      res.status(403).send('You must be logged in to edit shortURLs!');
    } else if (!uniqueURLs[req.params.id]) {
      proceed = false;
      res.status(403).send('You cannot edit shortURLs that you do not own!');
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
    let proceed = true;

    if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot delete a shortURL that: \n1. you do not own, or \n2.does not exist.');
      proceed = false;
    }

    delete uniqueURLs[req.params.id];
    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };

    if (proceed) {
      res.render('urls_index', templateVars);
    }
  })
// ***** ***** ***** ***** *****

  .get('/urls/new', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };
    res.render('urls_new', templateVars);
  })

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
// ***** ***** ***** ***** *****

  .get('/urls/:id', (req, res) => {
    let proceed = true;

    if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot update a shortURL that: \n1. you do not own, or \n2.does not exist.');
      proceed = false;
    }

    templateVars = {
      urls: uniqueURLs,
      shortURL: req.params.id,
      // users: users,
      loggedAsEmail: loggedAsEmail
    };
    if (proceed) {
      res.render('urls_show', templateVars);
    }
  })

// ***** ***** ***** ***** *****
  .post('/urls', (req, res) => {
    uniqueURLs[generateRandomString()] = req.body.longURL;

    res.redirect('/urls');
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