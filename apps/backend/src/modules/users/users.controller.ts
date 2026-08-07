import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AvatarService } from './avatar.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private avatarService: AvatarService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil propio' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil propio' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil público de usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Subir avatar de usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpeg|png|webp|gif)/)) {
          return cb(
            new BadRequestException(
              'Solo se permiten imágenes JPEG, PNG, WebP o GIF',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const avatarUrl = await this.avatarService.processAndSave(
      req.user.id,
      file,
    );

    return this.usersService.updateAvatar(req.user.id, avatarUrl);
  }
}
