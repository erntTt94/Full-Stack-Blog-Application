import Joi from 'joi';

export const postSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    image: Joi.optional()
})

export const subscribeSchema = Joi.object({
    email: Joi.string().regex(new RegExp("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")).required()
})

export const commentSchema = Joi.object({
    content: Joi.string().required(),
    scroll: Joi.optional(),
    post_id: Joi.optional()
})


