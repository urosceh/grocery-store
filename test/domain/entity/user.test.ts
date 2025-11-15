import Joi from 'joi';
import { Types } from 'mongoose';
import type { UserDoc } from '../../../src/database/model/User.model';
import { User } from '../../../src/domain/entity/User';

const userSchema = Joi.object({
  username: Joi.string().required(),
  name: Joi.string().required(),
  role: Joi.string().valid('manager', 'employee').required(),
  storeId: Joi.string().hex().length(24).required(),
});

describe('User entity', () => {
  it('maps from UserDoc and exposes getters', () => {
    const doc: Partial<UserDoc> = {
      username: 'alice',
      name: 'Alice',
      role: 'manager' as any,
      storeId: new Types.ObjectId(),
    };

    const user = new User(doc as UserDoc);
    expect(user.username).toBe('alice');
    expect(user.name).toBe('Alice');
    expect(user.role).toBe('manager');
    expect(user.storeId).toMatch(/^[0-9a-f]{24}$/);

    const validation = userSchema.validate({
      username: user.username,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
    });
    expect(validation.error).toBeUndefined();
  });
});
