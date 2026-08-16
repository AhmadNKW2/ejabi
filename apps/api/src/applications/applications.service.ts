import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const unique = new Set(dto.itemIds);
    if (unique.size !== 3) {
      throw new BadRequestException('يجب اختيار 3 خيارات مختلفة');
    }

    const items = await this.prisma.compareItem.findMany({
      where: { userId, id: { in: dto.itemIds } },
      include: { field: true, major: true, stage: true, country: true, university: true },
    });
    if (items.length !== 3) {
      throw new BadRequestException('بعض الخيارات غير موجودة في قائمة المقارنة');
    }

    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    const ordered = dto.itemIds.map((id) => byId[id]);

    return this.prisma.application.create({
      data: {
        userId,
        status: 'PENDING',
        choices: {
          create: ordered.map((item, index) => ({
            preferenceOrder: index + 1,
            fieldLabel: item.field.labelAr,
            majorLabel: item.major.isCustom
              ? item.customMajorLabel || item.major.labelAr
              : item.major.labelAr,
            stageLabel: item.stage.labelAr,
            countryLabel: item.country.labelAr,
            universityLabel: item.university.labelAr,
            years: item.years,
            annualCostUsd: item.annualCostUsd,
            totalCostUsd: item.totalCostUsd,
          })),
        },
      },
      include: { choices: { orderBy: { preferenceOrder: 'asc' } } },
    });
  }

  listMine(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: { choices: { orderBy: { preferenceOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMine(userId: string, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, userId },
      include: { choices: { orderBy: { preferenceOrder: 'asc' } } },
    });
    if (!app) throw new NotFoundException();
    return app;
  }

  adminList(status?: ApplicationStatus) {
    return this.prisma.application.findMany({
      where: status ? { status } : undefined,
      include: {
        choices: { orderBy: { preferenceOrder: 'asc' } },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminGet(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        choices: { orderBy: { preferenceOrder: 'asc' } },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
    if (!app) throw new NotFoundException();
    return app;
  }

  async adminUpdate(id: string, dto: UpdateApplicationDto) {
    await this.adminGet(id);
    return this.prisma.application.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote } : {}),
      },
      include: {
        choices: { orderBy: { preferenceOrder: 'asc' } },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
