import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
  ) {}

  async create(dto: CreateApplicationDto) {
    const keys = dto.choices.map(
      (c) => `${c.fieldId}:${c.majorId}:${c.stageId}:${c.countryId}:${c.universityId}`,
    );
    if (new Set(keys).size !== 3) {
      throw new BadRequestException('يجب اختيار 3 خيارات مختلفة');
    }

    const quotes = [];
    for (const choice of dto.choices) {
      quotes.push(await this.catalog.computeQuote(choice));
    }

    const fullName = dto.fullName.trim();
    const phone = dto.phone.trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      throw new BadRequestException('رقم الهاتف غير صالح');
    }
    const email = `g-${digits}@guest.ejabi.local`;
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: { fullName, phone },
      create: {
        email,
        fullName,
        phone,
        passwordHash,
        role: 'STUDENT',
      },
    });

    return this.prisma.application.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        choices: {
          create: quotes.map((item, index) => ({
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
