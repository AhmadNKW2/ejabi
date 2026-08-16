import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { QuoteDto } from '../catalog/dto/quote.dto';

const include = {
  field: true,
  major: true,
  stage: true,
  country: true,
  university: true,
} as const;

@Injectable()
export class CompareService {
  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
  ) {}

  list(userId: string) {
    return this.prisma.compareItem.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: 'asc' },
    });
  }

  async add(userId: string, dto: QuoteDto) {
    const count = await this.prisma.compareItem.count({ where: { userId } });
    if (count >= 3) {
      throw new BadRequestException('يمكن إضافة 3 خيارات كحد أقصى');
    }
    const quote = await this.catalog.computeQuote(dto);
    return this.prisma.compareItem.create({
      data: {
        userId,
        fieldId: dto.fieldId,
        majorId: dto.majorId,
        stageId: dto.stageId,
        countryId: dto.countryId,
        universityId: dto.universityId,
        customMajorLabel: quote.customMajorLabel,
        years: quote.years,
        annualCostUsd: quote.annualCostUsd,
        totalCostUsd: quote.totalCostUsd,
      },
      include,
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.compareItem.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException();
    await this.prisma.compareItem.delete({ where: { id } });
    return { ok: true };
  }
}
