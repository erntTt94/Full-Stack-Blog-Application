import express from 'express';
import 'dotenv/config';
import { postSchema } from '../../schemas.js'
import ExpressError from '../../utils/ExpressError.js';
import multer from 'multer';
import { isLoggedIn } from "../../middleware.js";
import { isAdmin } from "../../middleware.js";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../../index.js';
const router = express.Router();

const validatePost = (req, res, next) => {
    const { error } = postSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'uploads',
        format: async (req, file) => file.mimetype.split('/')[1],
        public_id: (req, file) => file.originalname.replace(/\.[^/.]+$/, '')
    }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    const postsResult = await db.query('SELECT posts.id, posts.title, posts.content, posts.image_url, posts.created_at, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC');
    const commentsResult = await db.query("SELECT comments.id,comments.content, comments.user_id, comments.post_id, users.username FROM comments JOIN users ON comments.user_id = users.id ORDER BY comments.created_at ASC");

    const posts = postsResult.rows;
    const comments = commentsResult.rows;
    const postsWithComments = posts.map(post => ({
        ...post, comments: comments.filter(comment => comment.post_id === post.id)
    }))
    res.render('posts/posts.ejs', {
        posts: postsWithComments,
        user: req.user || null,
    })
})

router.post('/', upload.single('image'), isLoggedIn, isAdmin, validatePost, async (req, res) => {
    let imageUrl = null;
    const { title, content } = req.body;
    const user = req.user;
    if (req.file) {
        imageUrl = req.file.path;
    }
    await db.query('INSERT INTO posts (title,content,user_id,image_url) VALUES ($1,$2, $3,$4)', [title, content, user.id, imageUrl]);
    req.flash('success', 'Successfully added new post.');
    res.redirect('/posts');
});


router.get('/new', isLoggedIn, isAdmin, (req, res) => {
    res.render('posts/new.ejs');
})

router.get('/:id/edit', isLoggedIn, isAdmin, async (req, res, next) => {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM posts WHERE id=$1", [id]);
    if (result.rows.length <= 0) {
        req.flash('error', 'Post is deleted!');
        return res.redirect('/posts');
    }
    res.render('posts/edit.ejs', { post: result.rows[0] });
})

router.put('/:id', upload.single('image'), isLoggedIn, isAdmin, validatePost, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    const item = await db.query('SELECT image_url FROM posts WHERE id = $1', [id]);
    let imageUrl = item.rows[0].image_url;

    if (req.file) {
        if (imageUrl) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`uploads/${publicId}`);
        }
        imageUrl = req.file.path;
    }
    await db.query('UPDATE posts SET title = $1, content = $2, image_url = COALESCE($3, image_url) WHERE id = $4', [title, content, imageUrl, id]);
    req.flash('success', 'Successfully updated post.');
    res.redirect('/posts');
})

router.delete('/:id', isLoggedIn, isAdmin, async (req, res, next) => {
    const { id } = req.params;
    const item = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const imageFile = item.rows[0].image_url;
    if (!item.rows[0] > 0) {
        next(new ExpressError('Item Not Found.', 404));
    } else {
        await db.query('DELETE FROM posts WHERE id = $1', [id]);
        req.flash('success', 'Successfully deleted post.');
        if (imageFile) {
            const publicId = imageFile.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`uploads/${publicId}`);
        }
    };
    res.redirect('/posts');
});

export default router;
