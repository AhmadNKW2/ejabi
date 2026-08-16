import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

function catalogViewOf(value: string) {
  return value === 'view2' ? 'view2' : 'view1';
}

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const row = await this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', catalogView: 'view1' },
      update: {},
    });
    return { catalogView: catalogViewOf(row.catalogView) };
  }

  async update(dto: UpdateSettingsDto) {
    const row = await this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', catalogView: dto.catalogView },
      update: { catalogView: dto.catalogView },
    });
    return { catalogView: catalogViewOf(row.catalogView) };
  }
}
