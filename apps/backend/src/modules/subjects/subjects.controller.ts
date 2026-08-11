import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar materias' })
  @ApiResponse({ status: 200, description: 'Lista de materias' })
  findAll() {
    return this.subjectsService.findAll();
  }
}
