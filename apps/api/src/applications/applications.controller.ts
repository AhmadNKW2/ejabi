import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/types/jwt-user';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Public } from '../common/decorators/public.decorator';

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

  @Public()
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applications.create(dto);
  }
}
