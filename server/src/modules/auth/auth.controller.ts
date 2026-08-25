import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CoreDataService } from '../../common/core-data.service.js';
import { validateBody } from '../../common/validate-body.pipe.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(CoreDataService) private readonly coreData: CoreDataService
  ) {}

  @Post('login')
  login(@Body(validateBody(LoginDto)) body: LoginDto) {
    return this.authService.login(body.contact);
  }

  @Post('signup')
  signup(@Body(validateBody(SignupDto)) body: SignupDto) {
    return this.authService.signup(body);
  }

  /**
   * Demo-only directory so a login screen can offer "sign in as" without the
   * visitor needing to already know a seeded contact number. Every identity
   * here is synthetic (see docs/service-catalog.md) — this is not a user
   * lookup over real accounts.
   */
  @Get('demo-users')
  listDemoUsers() {
    return this.coreData.listUsersPublic();
  }
}
