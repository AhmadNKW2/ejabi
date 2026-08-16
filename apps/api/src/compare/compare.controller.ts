import { Controller, Delete, Get, Param, Post, Body } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/types/jwt-user';
import { QuoteDto } from '../catalog/dto/quote.dto';

@Controller('compare')
export class CompareController {
  constructor(private compare: CompareService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.compare.list(user.id);
  }

  @Post()
  add(@CurrentUser() user: JwtUser, @Body() dto: QuoteDto) {
    return this.compare.add(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.compare.remove(user.id, id);
  }
}
