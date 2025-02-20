import 'dotenv/config';
import express from "express";
import methodOverride from 'method-override';
import pg from "pg";
import path from 'path';
import ejsMate from 'ejs-mate';
import ExpressError from './utils/ExpressError.js';
import posts from './views/routes/post.js';
import subscribe from './views/routes/subscribe.js';
import comments from './views/routes/comments.js';
import users from './views/routes/users.js';
import session from 'express-session';
import flash from 'connect-flash';
import passport from 'passport';
const __dirname = path.resolve();
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3000;

const sessionConfig = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

export const db = new Pool({
   connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false} : false,
    });

db.connect();

app.engine('ejs', ejsMate)
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }))

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/posts', posts);
app.use('/subscribe', subscribe);
app.use('/', users);
app.use('/comments', comments);


app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error.ejs', { err })
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

