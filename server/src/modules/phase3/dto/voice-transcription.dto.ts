import { IsBase64, IsOptional, IsString, MaxLength } from 'class-validator';

export class VoiceTranscriptionDto {
  @IsBase64()
  @MaxLength(33_500_000)
  audioBase64!: string;

  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @IsOptional()
  @IsString()
  language?: string;
}
