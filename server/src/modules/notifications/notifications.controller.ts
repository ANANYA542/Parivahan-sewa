import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { NotificationsService } from './notifications.service.js';

@Controller('users/:userId/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @Get()
  list(@Param('userId') userId: string) {
    return this.notifications.list(userId);
  }

  @Post(':notificationId/read')
  markRead(@Param('userId') userId: string, @Param('notificationId') notificationId: string) {
    return this.notifications.markRead(userId, notificationId);
  }
}
