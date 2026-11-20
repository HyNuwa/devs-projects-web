import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { ProfileContributionsQueryDto } from './dto/profile-contributions-query.dto';
import { PublicProfileService } from './public-profile.service';

/** The perfil público, open to anyone without signing in. */
@ApiTags('Users')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: PublicProfileService) {}

  @Public()
  @Get(':username')
  @ApiOperation({ summary: 'Perfil público por nombre de usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  byUsername(@Param('username') username: string) {
    return this.profiles.byUsername(username);
  }

  @Public()
  @Get(':username/contributions')
  @ApiOperation({ summary: 'Aportes públicos de un perfil, paginados' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  contributions(
    @Param('username') username: string,
    @Query() query: ProfileContributionsQueryDto,
  ) {
    return this.profiles.contributions(username, query.page ?? 1);
  }
}
