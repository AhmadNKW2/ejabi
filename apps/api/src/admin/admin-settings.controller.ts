import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Roles('ADMIN')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private settings: AdminSettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
