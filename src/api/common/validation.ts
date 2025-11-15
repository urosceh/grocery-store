import Joi from 'joi';

export const mongoObjectIdSchema = Joi.string().hex().length(24);
