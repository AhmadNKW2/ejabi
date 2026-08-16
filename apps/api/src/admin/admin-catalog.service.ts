import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import {
  CreateCountryDto,
  CreateFieldDto,
  CreateMajorDto,
  CreateStageDto,
  CreateUniversityDto,
  UpdateCountryDto,
  UpdateFieldDto,
  UpdateMajorDto,
  UpdateStageDto,
  UpdateUniversityDto,
} from './dto/catalog.dto';

@Injectable()
export class AdminCatalogService {
  constructor(private prisma: PrismaService) {}

  private async uniqueSlug(
    model: 'country' | 'field' | 'major' | 'stage' | 'university',
    base: string,
    extraWhere: Record<string, string> = {},
  ) {
    let slug = slugify(base);
    let i = 1;
    while (true) {
      const found = await (this.prisma[model] as unknown as {
        findFirst: (a: { where: Record<string, unknown> }) => Promise<{ id: string } | null>;
      }).findFirst({ where: { slug, ...extraWhere } });
      if (!found) return slug;
      slug = `${slugify(base)}-${++i}`;
    }
  }

  private async nextOrder(model: 'country' | 'field' | 'major' | 'stage' | 'university') {
    const last = await (this.prisma[model] as unknown as {
      findFirst: (a: { orderBy: { sortOrder: 'desc' } }) => Promise<{ sortOrder: number } | null>;
    }).findFirst({ orderBy: { sortOrder: 'desc' } });
    return (last?.sortOrder ?? 0) + 1;
  }

  async reorder(model: 'country' | 'field' | 'major' | 'stage' | 'university', ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        (this.prisma[model] as unknown as {
          update: (a: { where: { id: string }; data: { sortOrder: number } }) => Prisma.PrismaPromise<unknown>;
        }).update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    return { ok: true };
  }

  countries() {
    return this.prisma.country.findMany({ orderBy: { sortOrder: 'asc' } });
  }
  async createCountry(dto: CreateCountryDto) {
    const iso2 = dto.iso2.toUpperCase();
    return this.prisma.country.create({
      data: {
        iso2,
        slug: iso2.toLowerCase(),
        labelAr: dto.labelAr,
        labelEn: dto.labelEn,
        isActive: dto.isActive ?? true,
        sortOrder: await this.nextOrder('country'),
      },
    });
  }
  async updateCountry(id: string, dto: UpdateCountryDto) {
    await this.ensure('country', id);
    const iso2 = dto.iso2 ? dto.iso2.toUpperCase() : undefined;
    return this.prisma.country.update({
      where: { id },
      data: {
        ...dto,
        ...(iso2 ? { iso2, slug: iso2.toLowerCase() } : {}),
      },
    });
  }
  async deleteCountry(id: string) {
    await this.ensure('country', id);
    await this.prisma.country.delete({ where: { id } });
    return { ok: true };
  }

  fields() {
    return this.prisma.field.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { majors: { orderBy: { sortOrder: 'asc' } } },
    });
  }
  async createField(dto: CreateFieldDto) {
    return this.prisma.field.create({
      data: {
        labelAr: dto.labelAr,
        labelEn: dto.labelEn,
        icon: dto.icon || '📁',
        isActive: dto.isActive ?? true,
        slug: await this.uniqueSlug('field', dto.labelEn),
        sortOrder: await this.nextOrder('field'),
      },
    });
  }
  async updateField(id: string, dto: UpdateFieldDto) {
    await this.ensure('field', id);
    return this.prisma.field.update({ where: { id }, data: dto });
  }
  async deleteField(id: string) {
    await this.ensure('field', id);
    await this.prisma.field.delete({ where: { id } });
    return { ok: true };
  }

  majors() {
    return this.prisma.major.findMany({
      include: { field: true },
      orderBy: [{ field: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }
  async createMajor(dto: CreateMajorDto) {
    return this.prisma.major.create({
      data: {
        fieldId: dto.fieldId,
        labelAr: dto.labelAr,
        labelEn: dto.labelEn,
        icon: dto.icon || '📘',
        isCustom: dto.isCustom ?? false,
        isActive: dto.isActive ?? true,
        slug: await this.uniqueSlug('major', dto.labelEn),
        sortOrder: await this.nextOrder('major'),
      },
    });
  }
  async updateMajor(id: string, dto: UpdateMajorDto) {
    await this.ensure('major', id);
    return this.prisma.major.update({ where: { id }, data: dto });
  }
  async deleteMajor(id: string) {
    await this.ensure('major', id);
    await this.prisma.major.delete({ where: { id } });
    return { ok: true };
  }

  stages() {
    return this.prisma.stage.findMany({ orderBy: { sortOrder: 'asc' } });
  }
  async createStage(dto: CreateStageDto) {
    return this.prisma.stage.create({
      data: {
        labelAr: dto.labelAr,
        labelEn: dto.labelEn,
        icon: dto.icon || '🎓',
        years: dto.years,
        isActive: dto.isActive ?? true,
        slug: await this.uniqueSlug('stage', dto.labelEn),
        sortOrder: await this.nextOrder('stage'),
      },
    });
  }
  async updateStage(id: string, dto: UpdateStageDto) {
    await this.ensure('stage', id);
    return this.prisma.stage.update({ where: { id }, data: dto });
  }
  async deleteStage(id: string) {
    await this.ensure('stage', id);
    await this.prisma.stage.delete({ where: { id } });
    return { ok: true };
  }

  universities() {
    return this.prisma.university.findMany({
      include: { country: true, majors: true, prices: true },
      orderBy: [{ country: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }).then((rows) =>
      rows.map((u) => ({
        ...u,
        majorIds: u.majors.map((m) => m.majorId),
        majorStages: this.groupMajorStages(u.prices),
      })),
    );
  }
  async createUniversity(dto: CreateUniversityDto) {
    const offerings = dto.offerings || (dto.majorIds || []).map((majorId) => ({ majorId, stageIds: [] as string[] }));
    const created = await this.prisma.university.create({
      data: {
        labelAr: dto.labelAr,
        labelEn: dto.labelEn,
        logoUrl: dto.logoUrl || null,
        countryId: dto.countryId,
        isActive: dto.isActive ?? true,
        slug: await this.uniqueSlug('university', dto.labelEn, { countryId: dto.countryId }),
        sortOrder: await this.nextOrder('university'),
        majors: offerings.length ? { create: offerings.map((o) => ({ majorId: o.majorId })) } : undefined,
      },
    });
    await this.syncUniversityOfferings(created.id, offerings);
    return this.prisma.university.findUnique({
      where: { id: created.id },
      include: { country: true, majors: true, prices: true },
    });
  }
  async updateUniversity(id: string, dto: UpdateUniversityDto) {
    await this.ensure('university', id);
    const { majorIds, offerings, ...rest } = dto;
    if (offerings || majorIds) {
      await this.syncUniversityOfferings(
        id,
        offerings || (majorIds || []).map((majorId) => ({ majorId, stageIds: [] as string[] })),
      );
    }
    return this.prisma.university.update({
      where: { id },
      data: {
        ...rest,
        logoUrl: rest.logoUrl === undefined ? undefined : rest.logoUrl || null,
      },
      include: { country: true, majors: true, prices: true },
    });
  }
  async deleteUniversity(id: string) {
    await this.ensure('university', id);
    await this.prisma.university.delete({ where: { id } });
    return { ok: true };
  }

  majorPrices() {
    return this.prisma.universityMajorStage.findMany({
      include: { major: true, stage: true, university: { include: { country: true } } },
      orderBy: [
        { university: { sortOrder: 'asc' } },
        { major: { sortOrder: 'asc' } },
        { stage: { sortOrder: 'asc' } },
      ],
    });
  }
  upsertMajorPrice(dto: { majorId: string; universityId: string; stageId: string; costUsd: number }) {
    return this.prisma.universityMajorStage.upsert({
      where: {
        universityId_majorId_stageId: {
          universityId: dto.universityId,
          majorId: dto.majorId,
          stageId: dto.stageId,
        },
      },
      update: { costUsd: dto.costUsd },
      create: dto,
      include: { major: true, stage: true, university: { include: { country: true } } },
    });
  }
  async deleteMajorPrice(universityId: string, majorId: string, stageId: string) {
    await this.prisma.universityMajorStage.delete({
      where: { universityId_majorId_stageId: { universityId, majorId, stageId } },
    });
    return { ok: true };
  }

  private groupMajorStages(prices: { majorId: string; stageId: string; costUsd: number | null }[]) {
    const map = new Map<string, string[]>();
    for (const row of prices) {
      if (row.costUsd == null) continue;
      const list = map.get(row.majorId) || [];
      if (!list.includes(row.stageId)) list.push(row.stageId);
      map.set(row.majorId, list);
    }
    return [...map.entries()].map(([majorId, stageIds]) => ({ majorId, stageIds }));
  }

  private async syncUniversityOfferings(
    universityId: string,
    offerings: { majorId: string; stageIds: string[] }[],
  ) {
    const majorIds = offerings.map((o) => o.majorId);
    await this.prisma.universityMajor.deleteMany({ where: { universityId } });
    if (majorIds.length) {
      await this.prisma.universityMajor.createMany({
        data: majorIds.map((majorId) => ({ universityId, majorId })),
      });
    }
    const existing = await this.prisma.universityMajorStage.findMany({ where: { universityId } });
    const keep = new Set(offerings.flatMap((o) => o.stageIds.map((stageId) => `${o.majorId}:${stageId}`)));
    for (const offering of offerings) {
      for (const stageId of offering.stageIds) {
        const found = existing.find((row) => row.majorId === offering.majorId && row.stageId === stageId);
        if (!found) {
          await this.prisma.universityMajorStage.create({
            data: { universityId, majorId: offering.majorId, stageId, costUsd: null },
          });
        }
      }
    }
    const stale = existing.filter((row) => !keep.has(`${row.majorId}:${row.stageId}`));
    if (stale.length) {
      await this.prisma.universityMajorStage.deleteMany({
        where: {
          universityId,
          OR: stale.map((row) => ({ majorId: row.majorId, stageId: row.stageId })),
        },
      });
    }
  }

  private async ensure(
    model: 'country' | 'field' | 'major' | 'stage' | 'university',
    id: string,
  ) {
    const delegate = this.prisma[model] as unknown as {
      findUnique: (args: { where: { id: string } }) => Promise<unknown>;
    };
    const found = await delegate.findUnique({ where: { id } });
    if (!found) throw new NotFoundException();
  }
}
