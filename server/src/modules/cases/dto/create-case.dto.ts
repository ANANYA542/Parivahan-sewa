import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { SubmissionData } from '@parivahan/shared';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serviceId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicleId?: string;

  @IsObject()
  submissionData!: SubmissionData;
}
