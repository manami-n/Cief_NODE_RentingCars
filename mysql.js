
const mysql = require('mysql');

// MySQL configuration for both 3000 & 4000
const configMySQL = {
    host: process.env.HOST,
    port: process.env.MYPORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
};

const connMySQL = mysql.createConnection(configMySQL);

module.exports =  {configMySQL, connMySQL} ;