import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Public } from '../common/decorators/public.decorator';
import { QuoteDto } from './dto/quote.dto';

@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get()
  getCatalog() {
    return this.catalog.getPublicCatalog();
  }

  @Get('universities')
  getUniversities(@Query('countryId') countryId: string) {
    return this.catalog.getUniversities(countryId);
  }

  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.catalog.computeQuote(dto);
  }
}
