import Joi from 'joi';
import { DomainError } from '../../../src/domain/error/DomainError';
import { BadRequest, ForbiddenAccess, NotFound, UnauthorizedAccess } from '../../../src/domain/error/error.index';

const errorSchema = Joi.object({
  statusCode: Joi.number().required(),
  message: Joi.string().required(),
});

describe('DomainError', () => {
  it('exposes getters and error view', () => {
    const err = new DomainError(418, 'I am a teapot', { hint: 'brew' });
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe('I am a teapot');
    expect(err.details).toEqual({ hint: 'brew' });
    const validation = errorSchema.validate(err.error);
    expect(validation.error).toBeUndefined();
  });

  it('BadRequest sets 400', () => {
    const err = new BadRequest('bad');
    expect(err.statusCode).toBe(400);
    expect(errorSchema.validate(err.error).error).toBeUndefined();
  });

  it('UnauthorizedAccess sets 401', () => {
    const err = new UnauthorizedAccess('nope');
    expect(err.statusCode).toBe(401);
    expect(errorSchema.validate(err.error).error).toBeUndefined();
  });

  it('ForbiddenAccess sets 403', () => {
    const err = new ForbiddenAccess('forbidden');
    expect(err.statusCode).toBe(403);
    expect(errorSchema.validate(err.error).error).toBeUndefined();
  });

  it('NotFound sets 404', () => {
    const err = new NotFound('missing');
    expect(err.statusCode).toBe(404);
    expect(errorSchema.validate(err.error).error).toBeUndefined();
  });
});
