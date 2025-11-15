import Joi from 'joi';

export type LoginRequestBody = {
  username: string;
  password: string;
};

export const loginValidation = {
  body: Joi.object<LoginRequestBody>({
    username: Joi.string().trim().required(),
    password: Joi.string().min(1).required(),
  }),
};
