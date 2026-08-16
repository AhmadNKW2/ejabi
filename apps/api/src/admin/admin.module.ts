import { Module } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminApplicationsController } from './admin-applications.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [ApplicationsModule],
  providers: [AdminCatalogService, AdminSettingsService],
  controllers: [
    AdminCatalogController,
    AdminApplicationsController,
    AdminStatsController,
    AdminSettingsController,
  ],
})
export class AdminModule {}
