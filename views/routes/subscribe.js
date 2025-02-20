import express from 'express';
const router = express.Router();
import ExpressError from '../../utils/ExpressError.js';
import { subscribeSchema } from '../../schemas.js';
import { db } from '../../index.js';

const validateSub = (req, res, next) => {
    const { error } = subscribeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.post('/', validateSub, async (req, res, next) => {
    const { email } = req.body;
    const item = await db.query('SELECT * FROM subscribers WHERE email = $1', [email]);
    if (item.rows[0]) {
        next(new ExpressError('Already exist user with provided email address.', 404))
    } else {
        await db.query('INSERT INTO subscribers (email) VALUES ($1)', [email]);
        res.render('thanks.ejs');
    }

})

export default router;