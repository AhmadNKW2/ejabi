import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteDto } from '../../catalog/dto/quote.dto';

export class CreateApplicationDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => QuoteDto)
  choices!: QuoteDto[];
}
