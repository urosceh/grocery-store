import { DomainError } from './DomainError';

export class BadRequest extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, details ?? {});
  }
}

export class UnauthorizedAccess extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(401, message, details ?? {});
  }
}

export class ForbiddenAccess extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(403, message, details ?? {});
  }
}

export class NotFound extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(404, message, details ?? {});
  }
}
