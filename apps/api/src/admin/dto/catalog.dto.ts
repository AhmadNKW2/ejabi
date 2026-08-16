import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}

export class CreateCountryDto {
  @IsString()
  iso2!: string;

  @IsString()
  labelAr!: string;

  @IsString()
  labelEn!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  iso2?: string;

  @IsOptional()
  @IsString()
  labelAr?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFieldDto {
  @IsString()
  labelAr!: string;

  @IsString()
  labelEn!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  labelAr?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMajorDto {
  @IsString()
  fieldId!: string;

  @IsString()
  labelAr!: string;

  @IsString()
  labelEn!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMajorDto {
  @IsOptional()
  @IsString()
  fieldId?: string;

  @IsOptional()
  @IsString()
  labelAr?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateStageDto {
  @IsString()
  labelAr!: string;

  @IsString()
  labelEn!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  years!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  labelAr?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  years?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MajorStageOfferingDto {
  @IsString()
  majorId!: string;

  @IsArray()
  @IsString({ each: true })
  stageIds!: string[];
}

export class CreateUniversityDto {
  @IsString()
  labelAr!: string;

  @IsString()
  labelEn!: string;

  @IsString()
  countryId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  majorIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MajorStageOfferingDto)
  offerings?: MajorStageOfferingDto[];

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUniversityDto {
  @IsOptional()
  @IsString()
  labelAr?: string;

  @IsOptional()
  @IsString()
  labelEn?: string;

  @IsOptional()
  @IsString()
  countryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  majorIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MajorStageOfferingDto)
  offerings?: MajorStageOfferingDto[];

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertMajorPriceDto {
  @IsString()
  majorId!: string;

  @IsString()
  universityId!: string;

  @IsString()
  stageId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  costUsd!: number;
}
