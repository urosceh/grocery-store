import { Request } from 'express';

export abstract class AbstractUserRequest {
  private _username: string;
  private _storeId: string;
  private _userRole: string;

  constructor(private readonly request: Request) {
    this._username = request.headers.username as string;
    this._storeId = request.headers.store_id as string;
    this._userRole = request.headers.user_role as string;
  }

  public get username(): string {
    return this._username;
  }

  public get storeId(): string {
    return this._storeId;
  }

  public get userRole(): string {
    return this._userRole;
  }
}
