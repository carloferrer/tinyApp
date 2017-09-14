const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 8080;

const users = {
 //  "userRandomID": {
 //    id: "userRandomID",
 //    email: "user@example.com",
 //    password: "purple-monkey-dinosaur"
 //  },
 // "user2RandomID": {
 //    id: "user2RandomID",
 //    email: "user2@example.com",
 //    password: "dishwasher-funk"
 //  },
  "a": {
    id: "ADMINISTRATOR",
    email: "a@a",
    password: "a"
  },
  "b": {
    id: "ADMINISTRATOR-2",
    email: "b@b",
    password: "b"
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
let loggedAs = '';
let uniqueURLs ={};

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
        'password': bcrypt.hashSync(req.body.password, 10)
      };

      console.log(users[newUserID]['password']);
      urlDatabase[newUserID] = {};

      res.cookie('userID', newUserID);
      res.redirect('/urls');
    }
  })

  .get('/register', (req, res) => {
    templateVars = {
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
        // if (users[currentUser]['password'] === req.body.password) {
        if (bcrypt.compareSync(req.body.password, users[currentUser]['password'])) {
          proceed = true;
          console.log("You've logged in as: ", users[currentUser]['id']);
          // loggedAs = users[currentUser]['id'];

          // uniqueURLs = urlDatabase[loggedAs];

          res.cookie('userID', users[currentUser]['id']);
          loggedAs = users[currentUser]['id'];

          uniqueURLs = urlDatabase[loggedAs];
          console.log(req.cookies);
        } else {
          res.status(403).send('Password incorrect.');
          console.log(bcrypt.compareSync(req.body.password, users[currentUser]['password']));
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
      urls: uniqueURLs,
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

    console.log('Logged out. Cookie cleared. ');
    loggedAs = '';
    res.redirect('/urls');
  })
// ***** ***** ***** ***** *****

// REDIRECT FROM SHORT URL TO LONG URL
// ***** ***** ***** ***** *****
  .get('/u/:shortURL', (req, res) => {
    let longURL = '';

    for (let uniqueUser in urlDatabase) {
      // console.log(u);
      // console.log(url[u]);
      for (let short in urlDatabase[uniqueUser]) {
        if (req.params.shortURL === short) {
          longURL = urlDatabase[uniqueUser][short];
        }
      }
    }
    console.log(longURL);
    res.redirect(longURL);
  })
// ***** ***** ***** ***** *****

// UPDATE A SHORT URL
// ***** ***** ***** ***** *****
  .get('/urls/:id/update', (req, res) => {
    let proceed = true;
    // authenticate();

    if (!uniqueURLs[req.params.id]) {
      proceed = false;
      res.status(403).send('You cannot update a shortURL that: \n1. you do not own, or \n2.does not exist.');
    }

    templateVars = {
      urls: uniqueURLs,
      shortURL: req.params.id,
      loggedAs: loggedAs
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
      // users: users,
      loggedAs: loggedAs
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
      // users: users,
      loggedAs: loggedAs
    };

    if (proceed) {
      res.render('urls_index', templateVars);
    }
  })
// ***** ***** ***** ***** *****

  .get('/urls/new', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_new', templateVars);
  })

// LOAD INDEX PAGE
// ***** ***** ***** ***** *****
  .get('/urls', (req, res) => {
    templateVars = {
      urls: uniqueURLs,
      // users: users,
      loggedAs: loggedAs
    };
    res.render('urls_index', templateVars);
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
      loggedAs: loggedAs
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
      loggedAs: loggedAs
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