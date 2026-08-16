import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QuoteDto {
  @IsUUID()
  fieldId!: string;

  @IsUUID()
  majorId!: string;

  @IsUUID()
  stageId!: string;

  @IsUUID()
  countryId!: string;

  @IsUUID()
  universityId!: string;

  @IsOptional()
  @IsString()
  customMajorLabel?: string;
}
