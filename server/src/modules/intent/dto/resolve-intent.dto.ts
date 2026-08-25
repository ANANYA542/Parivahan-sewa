import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolveIntentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query!: string;
}
