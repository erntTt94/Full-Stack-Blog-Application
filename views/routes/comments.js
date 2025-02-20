import express from 'express';
import { isLoggedIn } from "../../middleware.js";
import { commentSchema } from '../../schemas.js'
import ExpressError from '../../utils/ExpressError.js';
const router = express.Router();
import { db } from '../../index.js';

const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

router.post('/:postId', isLoggedIn, validateComment, async (req, res) => {
    const { postId } = req.params;
    const { content, post_id } = req.body;
    const userId = req.user.id;
    try {
        await db.query('INSERT INTO comments (user_id, post_id, content) VALUES ($1,$2,$3)', [userId, postId, content]);
        res.redirect(`/posts#post-${post_id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding comment');
    }
})

router.put('/edit/:commentId', isLoggedIn, validateComment, async (req, res) => {
    const { commentId } = req.params;
    const { content, post_id } = req.body;
    const userId = req.user.id;
    try {
        const result = await db.query('UPDATE comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [content, commentId, userId]);
        if (result.rowCount === 0) throw new Error('Unauthorized', 403);
        res.redirect(`/posts#post-${post_id}`);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error updating comment');
    }
})

router.delete('/delete/:commentId', isLoggedIn, async (req, res) => {
    const { commentId } = req.params;
    const { post_id } = req.body;
    const userId = req.user.id;
    try {
        const result = await db.query('DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *', [commentId, userId]);
        if (result.rowCount === 0) throw new Error('Unauthorized', 403);
        res.redirect(`/posts#post-${post_id}`);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting comment');
    }
})

export default router;
