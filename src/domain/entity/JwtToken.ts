import jwt from 'jsonwebtoken';
import { JwtUserTokenPayload } from '../types/JwtUserTokenPayload';

export class JwtUserToken {
  private static readonly secret = process.env.JWT_SECRET!;
  private static readonly expiresIn = Number(process.env.JWT_EXPIRES_IN) || 2 * 60 * 60; // 2 hours

  public static initialize(): void {
    if (!this.secret) {
      throw new Error('JWT secret is not configured');
    }
  }

  public static sign(payload: JwtUserTokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: 'HS256', expiresIn: this.expiresIn });
  }

  public static verify(token: string): JwtUserTokenPayload {
    return jwt.verify(token, this.secret) as JwtUserTokenPayload;
  }
}
