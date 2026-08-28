import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DiscoverySuggestionsQueryDto } from './dto/discovery-suggestions-query.dto';
import { DiscoverySuggestionsResponseDto } from './dto/discovery-suggestions-response.dto';
import { DiscoveryService } from './discovery.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('suggestions')
  @Public()
  @ApiOperation({
    summary: 'Sugerir materias y recursos académicos por búsqueda',
  })
  @ApiResponse({ status: 200, type: DiscoverySuggestionsResponseDto })
  @ApiResponse({ status: 400, description: 'Consulta de sugerencias inválida' })
  getSuggestions(@Query() query: DiscoverySuggestionsQueryDto) {
    return this.discoveryService.getSuggestions(query);
  }
}
