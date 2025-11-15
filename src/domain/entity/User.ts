import { UserDoc } from '../../database/model/User.model';

export class User {
  private _username: string;
  private _name: string;
  private _role: string;
  private _storeId: string;

  constructor(user: UserDoc) {
    this._username = user.username;
    this._name = user.name;
    this._role = user.role;
    this._storeId = user.storeId.toString();
  }

  public get username(): string {
    return this._username;
  }

  public get name(): string {
    return this._name;
  }

  public get role(): string {
    return this._role;
  }

  public get storeId(): string {
    return this._storeId;
  }

  public toDto() {
    return {
      username: this._username,
      name: this._name,
      role: this._role,
      storeId: this._storeId,
    };
  }
}
