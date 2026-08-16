import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { ensureUploadDirs, UNIVERSITY_UPLOADS_DIR } from '../upload-paths';
import { AdminCatalogService } from './admin-catalog.service';
import {
  CreateCountryDto,
  CreateFieldDto,
  CreateMajorDto,
  CreateStageDto,
  CreateUniversityDto,
  ReorderDto,
  UpdateCountryDto,
  UpdateFieldDto,
  UpdateMajorDto,
  UpdateStageDto,
  UpdateUniversityDto,
  UpsertMajorPriceDto,
} from './dto/catalog.dto';

const UNIVERSITY_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const UNIVERSITY_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

@Roles('ADMIN')
@Controller('admin')
export class AdminCatalogController {
  constructor(private catalog: AdminCatalogService) {}

  @Get('countries')
  countries() {
    return this.catalog.countries();
  }
  @Post('countries')
  createCountry(@Body() dto: CreateCountryDto) {
    return this.catalog.createCountry(dto);
  }
  @Patch('countries/reorder')
  reorderCountries(@Body() dto: ReorderDto) {
    return this.catalog.reorder('country', dto.ids);
  }
  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.catalog.updateCountry(id, dto);
  }
  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.catalog.deleteCountry(id);
  }

  @Get('fields')
  fields() {
    return this.catalog.fields();
  }
  @Post('fields')
  createField(@Body() dto: CreateFieldDto) {
    return this.catalog.createField(dto);
  }
  @Patch('fields/reorder')
  reorderFields(@Body() dto: ReorderDto) {
    return this.catalog.reorder('field', dto.ids);
  }
  @Patch('fields/:id')
  updateField(@Param('id') id: string, @Body() dto: UpdateFieldDto) {
    return this.catalog.updateField(id, dto);
  }
  @Delete('fields/:id')
  deleteField(@Param('id') id: string) {
    return this.catalog.deleteField(id);
  }

  @Get('majors')
  majors() {
    return this.catalog.majors();
  }
  @Post('majors')
  createMajor(@Body() dto: CreateMajorDto) {
    return this.catalog.createMajor(dto);
  }
  @Patch('majors/reorder')
  reorderMajors(@Body() dto: ReorderDto) {
    return this.catalog.reorder('major', dto.ids);
  }
  @Patch('majors/:id')
  updateMajor(@Param('id') id: string, @Body() dto: UpdateMajorDto) {
    return this.catalog.updateMajor(id, dto);
  }
  @Delete('majors/:id')
  deleteMajor(@Param('id') id: string) {
    return this.catalog.deleteMajor(id);
  }

  @Get('stages')
  stages() {
    return this.catalog.stages();
  }
  @Post('stages')
  createStage(@Body() dto: CreateStageDto) {
    return this.catalog.createStage(dto);
  }
  @Patch('stages/reorder')
  reorderStages(@Body() dto: ReorderDto) {
    return this.catalog.reorder('stage', dto.ids);
  }
  @Patch('stages/:id')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.catalog.updateStage(id, dto);
  }
  @Delete('stages/:id')
  deleteStage(@Param('id') id: string) {
    return this.catalog.deleteStage(id);
  }

  @Get('universities')
  universities() {
    return this.catalog.universities();
  }
  @Post('universities/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDirs();
          cb(null, UNIVERSITY_UPLOADS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase();
          const safeExt = UNIVERSITY_IMAGE_EXTS.has(ext) ? ext : '.jpg';
          cb(null, `${randomUUID()}${safeExt}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (UNIVERSITY_IMAGE_TYPES.has(file.mimetype)) {
          cb(null, true);
          return;
        }
        cb(new BadRequestException('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.'), false);
      },
    }),
  )
  uploadUniversityImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('اختر صورة للجامعة');
    }
    return { url: `/uploads/universities/${file.filename}` };
  }
  @Post('universities')
  createUniversity(@Body() dto: CreateUniversityDto) {
    return this.catalog.createUniversity(dto);
  }
  @Patch('universities/reorder')
  reorderUniversities(@Body() dto: ReorderDto) {
    return this.catalog.reorder('university', dto.ids);
  }
  @Patch('universities/:id')
  updateUniversity(@Param('id') id: string, @Body() dto: UpdateUniversityDto) {
    return this.catalog.updateUniversity(id, dto);
  }
  @Delete('universities/:id')
  deleteUniversity(@Param('id') id: string) {
    return this.catalog.deleteUniversity(id);
  }

  @Get('prices')
  prices() {
    return this.catalog.majorPrices();
  }
  @Post('prices')
  upsertPrice(@Body() dto: UpsertMajorPriceDto) {
    return this.catalog.upsertMajorPrice(dto);
  }
  @Delete('prices/:universityId/:majorId/:stageId')
  deletePrice(
    @Param('universityId') universityId: string,
    @Param('majorId') majorId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.catalog.deleteMajorPrice(universityId, majorId, stageId);
  }
}
