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
let loggedAsEmail = '';
let uniqueURLs ={};

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
        'password': bcrypt.hashSync(req.body.password, 10)
      };

      urlDatabase[newUserID] = {};

      res.redirect('/urls');
    }
  })

  .get('/register', (req, res) => {
    templateVars = {
      loggedAsEmail: loggedAsEmail
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

        if (bcrypt.compareSync(req.body.password, users[currentUser]['password'])) {

          proceed = true;
          console.log("You've logged in as: ", users[currentUser]['email']);

          req.session.userID = users[currentUser]['id'];
          loggedAsEmail = users[currentUser]['email'];
          uniqueURLs = urlDatabase[users[currentUser]['id']];

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
    }

  })

  .get('/login', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      loggedAsEmail: loggedAsEmail
    };

    res.render('urls_login', templateVars);
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

    if (!uniqueURLs[req.params.id]) {
      proceed = false;
      res.status(403).send('You cannot update a shortURL that: \n1. you do not own, or \n2.does not exist.');
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
    authenticate();
    if (!uniqueURLs[req.params.id]) {
      res.status(403).send('You cannot update a shortURL that: \n1. you do not own, or \n2.does not exist.');
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

    templateVars = {
      urls: uniqueURLs,
      // users: users,
      loggedAsEmail: loggedAsEmail
    };
    res.render('urls_index', templateVars);
    // console.log(req.body); // debug statement to see POST parameters
    // res.send('OK'); // respond w/ OK (to be replaced)
  })

  .set('view engine', 'ejs')

  .listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
  });
// ***** ***** ***** ***** *****

function authenticate() {
  // for (let uniqueUser in urlDatabase) {
  //   for (let short in urlDatabase[uniqueUser]) {
  //     if (loggedAs !== uniqueUser) {
  //       res.status(403).send('You are not the owner of this shortURL.  You may only manipulate this shortURL if you are the owner.')
  //     }
  //   }
  // }
}

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