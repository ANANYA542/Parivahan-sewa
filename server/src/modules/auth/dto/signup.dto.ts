import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  contact!: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  preferredLanguage?: string;
}
