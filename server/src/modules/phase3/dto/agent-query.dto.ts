import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class AgentQueryDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsArray()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
