import { IsIn } from 'class-validator';

export class UpdateSettingsDto {
  @IsIn(['view1', 'view2'])
  catalogView!: 'view1' | 'view2';
}
