// Load config
require('dotenv').config({ path: `${__dirname}/config/config.env` });

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const favicon = require('serve-favicon');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');


const app = express();

const connectDB = require('./config/db');


// Serve favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


// Load databse
connectDB();


// Handlebars Helpers
const { multiply } = require('./helpers/hbs');


// Handlebars
app.engine('hbs', exphbs({
    helpers: {
        multiply
    },
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.set('view engine', '.hbs');


// Static folder
app.use(express.static(path.join(__dirname, 'public')));


// Sessions
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
    //store: new MongoStore({ mongooseConnection: mongoose.connection })
}));


// Flash messages
app.use(flash());


// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



// Routes
app.use('/', require('./routes/index'));




//404 handler
app.use(function(req,res){
    res.status(404);
    res.render('error/404');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`));