import { Module } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CompareController } from './compare.controller';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  providers: [CompareService],
  controllers: [CompareController],
  exports: [CompareService],
})
export class CompareModule {}
