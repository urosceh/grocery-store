import jwt from 'jsonwebtoken';
import { UnauthorizedAccess } from '../error/error.index';
import { JwtUserTokenPayload } from '../types/JwtUserTokenPayload';

export class JwtUserToken {
  private static readonly secret = process.env.JWT_SECRET ?? 'test-secret';
  private static readonly expiresIn = Number(process.env.JWT_EXPIRES_IN) || 2 * 60 * 60; // 2 hours

  public static initialize(): void {
    if (!this.secret) {
      console.error('JWT secret is using default value');
    }
  }

  public static sign(payload: JwtUserTokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: 'HS256', expiresIn: this.expiresIn });
  }

  public static verify(token: string): JwtUserTokenPayload {
    try {
      return jwt.verify(token, this.secret) as JwtUserTokenPayload;
    } catch (error) {
      throw new UnauthorizedAccess('Invalid token');
    }
  }
}
