export class DomainError {
  private _statusCode: number;
  private _message: string;
  private _details: Record<string, any>;

  constructor(stautsCode: number, message: string, details: Record<string, any>) {
    this._statusCode = stautsCode;
    try {
      this._message = message;
    } catch (error) {
      this._message = 'Unknown Error Message';
    }

    try {
      this._details = details;
    } catch (error) {
      this._details = {};
    }
  }

  get statusCode(): number {
    return this._statusCode;
  }

  get message(): string {
    return this._message;
  }

  get details(): Record<string, any> {
    return this._details;
  }

  public get error(): { statusCode: number; message: string } {
    return {
      statusCode: this._statusCode,
      message: this._message,
    };
  }
}
