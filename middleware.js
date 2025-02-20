export const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in!');
        return res.redirect('/login');
    }
    next();
}

export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'Unauthorized');
        return res.redirect('/posts');
    }
    next();
}


