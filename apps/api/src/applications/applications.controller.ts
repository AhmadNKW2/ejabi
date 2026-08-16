import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/types/jwt-user';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private applications: ApplicationsService) {}

  @Get()
  listMine(@CurrentUser() user: JwtUser) {
    return this.applications.listMine(user.id);
  }

  @Get(':id')
  getMine(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.applications.getMine(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateApplicationDto) {
    return this.applications.create(user.id, dto);
  }
}
