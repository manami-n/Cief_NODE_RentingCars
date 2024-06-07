// import modules
const express = require('express');
const path = require('path');
const mysql = require('mysql');
//mysql connection information in another file.
const {configMySQL, connMySQL} = require('./mysql.js');
// npm express-session and express-mysql-session for sessoions saving data.
const session = require('express-session');
//import MySQLStore from 'express-mysql-session';
const expressMySqlSession = require("express-mysql-session");
const MySQLStore  = expressMySqlSession(session);



///////////////////////////////
// Public server setup 
///////////////////////////////

const appPubl = express();
appPubl.set('view engine', 'ejs');

// ======== Session management ==========
const sessionStore = new MySQLStore(configMySQL);

// setting the session using express-session
appPubl.use(session({
    key: process.env.KEY,
    secret: process.env.SECKEY ,// Secret key is inside .env
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // HTTP --> false, HTTPS --> true
        maxAge: 1000 * 60 * 60 * 24 * 2, // save for 2 days
    } 
}));

// MySQLStore checking
sessionStore.onReady().then(() => {
    console.log('MySQLStore ready');
}).catch(error => {
    console.error(error);
});

// ======================================

// setting the port
const PORTPUBL = process.env.PORTPUBL || 3000; // Publica

// Static set up
appPubl.use(express.static('public'));

// json enabled, before importing router.js
appPubl.use(express.json());
appPubl.use(express.urlencoded({ extended: true }));

// importing router.js
const routerPubl = require('./routerPubl.js');
appPubl.use(routerPubl);

// connect to server
appPubl.listen(PORTPUBL, () => {
    console.log(`Server PUBL running on http://localhost:${PORTPUBL}`);
})

///////////////////////////////
// Private server setup 
///////////////////////////////

const appPriv = express();
appPriv.set('view engine', 'ejs');

//setting the port
const PORTPRIV = process.env.PORTPRIV || 4000; // Private

// Static set up
appPriv.use(express.static('private'));

// json enabled, before importing router.js
appPriv.use(express.json());
appPriv.use(express.urlencoded({ extended: true }));

// importing router.js
const routerPriv = require('./routerPriv.js');
appPriv.use(routerPriv);

// connect to server
appPriv.listen(PORTPRIV, () => {
    console.log(`Server PRIV running on http://localhost:${PORTPRIV}`);
})
