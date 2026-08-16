import { Controller, Get, Param, Patch, Query, Body } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { ApplicationsService } from '../applications/applications.service';
import { UpdateApplicationDto } from '../applications/dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Roles('ADMIN')
@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(private applications: ApplicationsService) {}

  @Get()
  list(@Query('status') status?: ApplicationStatus) {
    return this.applications.adminList(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.applications.adminGet(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applications.adminUpdate(id, dto);
  }
}
