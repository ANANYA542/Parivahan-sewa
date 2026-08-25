import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { VoiceTranscription } from '@parivahan/shared';
import type { VoiceTranscriptionDto } from './dto/voice-transcription.dto.js';

@Injectable()
export class VoiceService {
  async transcribe(input: VoiceTranscriptionDto): Promise<VoiceTranscription> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('Voice is not configured. Add GROQ_API_KEY to the server environment.');
    const bytes = Buffer.from(input.audioBase64, 'base64');
    if (!bytes.length || bytes.length > 25 * 1024 * 1024) throw new BadRequestException('Audio must be between 1 byte and 25 MB.');

    const form = new FormData();
    form.append('file', new Blob([bytes], { type: input.mimeType }), 'voice.webm');
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('prompt', 'Parivahan vehicle service requests, challans, PUC, driving licence, RC, NOC, and road safety.');
    if (input.language) form.append('language', input.language);
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form });
    const payload = await response.json().catch(() => null) as { text?: string; language?: string; error?: { message?: string } } | null;
    if (!response.ok || !payload?.text) throw new ServiceUnavailableException(payload?.error?.message ?? 'Voice transcription could not be completed.');
    return { text: payload.text, ...(payload.language ? { language: payload.language } : {}) };
  }
}
