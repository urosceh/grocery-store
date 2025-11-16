import type { Request, Response } from 'express';
import { UserService } from '../../domain/service/User.service';
import { CreateUserRequest } from './request/create.user.request';

export class UserController {
  constructor(private readonly userService: UserService) {}

  public login = async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };
    const result = await this.userService.login(username, password);
    res.json(result);
  };

  public logout = async (_req: Request, res: Response) => {
    res.status(204).send();
  };

  public create = async (req: Request, res: Response) => {
    const request = new CreateUserRequest(req);
    await this.userService.create(request.createUserBody);
    res.json('User created successfully');
  };
}
