import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteDto } from './dto/quote.dto';

function groupMajorStages(prices: { majorId: string; stageId: string; costUsd: number | null }[]) {
  const map = new Map<string, string[]>();
  for (const row of prices) {
    if (row.costUsd == null) continue;
    const list = map.get(row.majorId) || [];
    if (!list.includes(row.stageId)) list.push(row.stageId);
    map.set(row.majorId, list);
  }
  return [...map.entries()].map(([majorId, stageIds]) => ({ majorId, stageIds }));
}

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  private catalogCache: { at: number; data: Awaited<ReturnType<CatalogService['loadPublicCatalog']>> } | null = null;

  async getPublicCatalog() {
    if (this.catalogCache && Date.now() - this.catalogCache.at < 15_000) {
      return this.catalogCache.data;
    }
    const data = await this.loadPublicCatalog();
    this.catalogCache = { at: Date.now(), data };
    return data;
  }

  private async loadPublicCatalog() {
    const [countries, fields, stages, settingsRow] = await Promise.all([
      this.prisma.country.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          universities: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: { majors: true, prices: true },
          },
        },
      }),
      this.prisma.field.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          majors: { where: { isActive: true, isCustom: false }, orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.stage.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.siteSettings.findUnique({ where: { id: 'default' } }),
    ]);
    const settings =
      settingsRow ??
      (await this.prisma.siteSettings.create({ data: { id: 'default', catalogView: 'view1' } }));
    return {
      catalogView: settings.catalogView === 'view2' ? 'view2' : 'view1',
      countries: countries.map((c) => ({
        ...c,
        universities: c.universities.map(({ majors, prices, ...u }) => ({
          ...u,
          majorIds: majors.map((m) => m.majorId),
          majorStages: groupMajorStages(prices),
        })),
      })),
      fields,
      majors: fields.flatMap((f) => f.majors),
      stages,
    };
  }

  async getUniversities(countryId: string) {
    return this.prisma.university.findMany({
      where: { countryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async computeQuote(dto: QuoteDto) {
    const [field, major, stage, country, university] = await Promise.all([
      this.prisma.field.findUnique({ where: { id: dto.fieldId } }),
      this.prisma.major.findUnique({ where: { id: dto.majorId } }),
      this.prisma.stage.findUnique({ where: { id: dto.stageId } }),
      this.prisma.country.findUnique({ where: { id: dto.countryId } }),
      this.prisma.university.findUnique({ where: { id: dto.universityId } }),
    ]);

    if (!field || !major || !stage || !country || !university) {
      throw new NotFoundException('عنصر غير موجود في الكتالوج');
    }
    if (university.countryId !== country.id) {
      throw new BadRequestException('الجامعة لا تنتمي إلى الدولة المختارة');
    }
    if (major.fieldId !== field.id) {
      throw new BadRequestException('التخصص لا ينتمي إلى الحقل المختار');
    }
    const offeredMajor = await this.prisma.universityMajor.findUnique({
      where: { universityId_majorId: { universityId: university.id, majorId: major.id } },
    });
    if (!offeredMajor) {
      throw new BadRequestException('الجامعة لا تقدم هذا التخصص');
    }
    const priced = await this.prisma.universityMajorStage.findUnique({
      where: {
        universityId_majorId_stageId: {
          universityId: university.id,
          majorId: major.id,
          stageId: stage.id,
        },
      },
    });
    if (!priced) {
      throw new BadRequestException('الجامعة لا تقدم هذا التخصص في هذه المرحلة');
    }

    const years = stage.years;
    if (!years) {
      throw new BadRequestException('لا توجد مدة دراسية مُعرّفة لهذه المرحلة');
    }

    const totalCostUsd = priced.costUsd;
    if (totalCostUsd == null) {
      throw new BadRequestException('لا يوجد سعر لهذا التخصص في هذه الجامعة وهذه المرحلة');
    }
    const annualCostUsd = Math.round(totalCostUsd / years);

    return {
      years,
      annualCostUsd,
      totalCostUsd,
      field,
      major,
      stage,
      country,
      university,
      customMajorLabel: major.isCustom ? dto.customMajorLabel!.trim() : null,
    };
  }
}
