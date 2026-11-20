import { Body, Controller, Get, Put, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReplaceProfileCustomizationDto } from './dto/replace-profile-customization.dto';
import { ProfileCustomizationService } from './profile-customization.service';

type AuthedRequest = { user: { id: string } };

/** Mi perfil → «Perfil público»: the signed-in student's own choices. */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users/me/profile-customization')
export class ProfileCustomizationController {
  constructor(private readonly customization: ProfileCustomizationService) {}

  @Get()
  @ApiOperation({ summary: 'Mi personalización del perfil público' })
  mine(@Request() req: AuthedRequest) {
    return this.customization.mine(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Reemplazar mi personalización del perfil público' })
  replace(
    @Request() req: AuthedRequest,
    @Body() body: ReplaceProfileCustomizationDto,
  ) {
    return this.customization.replace(req.user.id, body);
  }
}
