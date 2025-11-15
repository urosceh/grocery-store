import type { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { BadRequest } from '../../domain/error/error.index';

type Schemas = {
  body?: Joi.ObjectSchema<any>;
  params?: Joi.ObjectSchema<any>;
  query?: Joi.ObjectSchema<any>;
};

export class JoiValidationMiddleware {
  public static validate(schemas: Schemas) {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        if (schemas.body) {
          const { error, value } = schemas.body.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
          });
          if (error) {
            throw new BadRequest('Invalid request body', {
              details: error.details.map((d) => d.message),
            });
          }
          req.body = value;
        }

        if (schemas.params) {
          const { error, value } = schemas.params.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
          });
          if (error) {
            throw new BadRequest('Invalid route params', {
              details: error.details.map((d) => d.message),
            });
          }
          req.params = value as any;
        }

        if (schemas.query) {
          const { error, value } = schemas.query.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
          });
          if (error) {
            throw new BadRequest('Invalid query params', {
              details: error.details.map((d) => d.message),
            });
          }
        }

        next();
      } catch (err) {
        next(err);
      }
    };
  }
}
