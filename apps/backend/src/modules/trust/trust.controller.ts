import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TrustService } from './trust.service';

type AuthedRequest = { user: { id: string } };

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users/me/privileges')
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Get()
  @ApiOperation({ summary: 'Mis privilegios de confianza' })
  mine(@Request() req: AuthedRequest) {
    return this.trust.mine(req.user.id);
  }
}
