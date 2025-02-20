import express from 'express';
const router = express.Router();
import bcrypt from "bcrypt";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import ExpressError from '../../utils/ExpressError.js';
import { db } from '../../index.js';


passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
        try {
            const result = await db.query("SELECT * FROM users WHERE username = $1 ", [
                username,
            ]);
            if (result.rows.length === 0) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect username or password.' })
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

router.get('/register', (_req, res) => {
    res.render('users/register.ejs');
})

router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;
    const checkUser = await db.query("SELECT * FROM users WHERE username = $1", [
        username]);
    const checkEmail = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) {
        req.flash('error', 'User already exist!');
        res.redirect("/register");
    } else if (checkEmail.rows.length > 0) {
        req.flash('error', 'Email already exist!');
        res.redirect("/register");
    } else {
        bcrypt.hash(password, 12, async (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
            } else {
                const result = await db.query(
                    "INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING *",
                    [username, hash, email, 'user']
                );
                const user = result.rows[0];
                req.login(user, (_err) => {
                    req.flash('success', 'Welcome.');
                    res.redirect("/");
                });
            }
        });
    }
});

router.get("/login", (_req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", passport.authenticate("local", { failureFlash: true, successFlash: true, failureRedirect: "/login" }), (req, res) => {
    req.flash('success', 'Welcome back.');
    res.redirect('/');
});


router.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye...');
        res.redirect('/');
    });
});



passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return done(new ExpressError('User not found!'));
        }
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});


export default router;
