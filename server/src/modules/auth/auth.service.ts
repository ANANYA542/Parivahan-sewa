import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthSession, UserProfile } from '@parivahan/shared';
import { CoreDataService } from '../../common/core-data.service.js';

export interface AuthTokenPayload {
  sub: string;
}

const DEV_FALLBACK_SECRET = 'parivahan-track-dev-secret-do-not-use-in-production';

export const JWT_SECRET = process.env.JWT_SECRET ?? DEV_FALLBACK_SECRET;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(CoreDataService) private readonly coreData: CoreDataService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {
    if (!process.env.JWT_SECRET) {
      this.logger.warn('JWT_SECRET is not set — using a fallback development secret. Set JWT_SECRET before deploying this anywhere real.');
    }
  }

  async login(contact: string): Promise<AuthSession> {
    const user = await this.coreData.findUserByContact(contact);
    if (!user) {
      throw new UnauthorizedException('No account matches that contact detail.');
    }

    return { token: this.issueToken(user), user };
  }

  async signup(input: { name: string; contact: string; preferredLanguage?: string }): Promise<AuthSession> {
    const user = await this.coreData.registerUser(input);
    return { token: this.issueToken(user), user };
  }

  issueToken(user: UserProfile): string {
    const payload: AuthTokenPayload = { sub: user.userId };
    return this.jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: '12h' });
  }

  verify(token: string): AuthTokenPayload {
    return this.jwtService.verify<AuthTokenPayload>(token, { secret: JWT_SECRET });
  }
}
