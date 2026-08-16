import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Roles('ADMIN')
@Controller('admin')
export class AdminStatsController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [
      students,
      applications,
      pendingApplications,
      countries,
      fields,
      majors,
      stages,
      universities,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: 'PENDING' } }),
      this.prisma.country.count(),
      this.prisma.field.count(),
      this.prisma.major.count(),
      this.prisma.stage.count(),
      this.prisma.university.count(),
    ]);
    return {
      students,
      applications,
      pendingApplications,
      countries,
      fields,
      majors,
      stages,
      universities,
    };
  }

  @Get('students')
  students(@Query('q') q?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
