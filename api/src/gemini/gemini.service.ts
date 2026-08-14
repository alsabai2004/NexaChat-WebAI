import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeminiService {
    private readonly apiKey: string;
    private readonly model: string;

    constructor(
        private readonly httpService: HttpService,
        configService: ConfigService,
    ) {
        this.apiKey = configService.get<string>('GEMINI_API_KEY') || '';
        this.model =
            configService.get<string>('GEMINI_MODEL') ||
            'gemini-2.5-flash';
    }

    async sendMessage(
        prompt: string,
        history: { role: 'user' | 'model'; text: string }[] = [],
    ): Promise<string> {
        if (!this.apiKey) {
            throw new HttpException(
                'Gemini API key is not configured.',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        if (!prompt?.trim()) {
            throw new HttpException(
                'Message cannot be empty',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/` +
                `${this.model}:generateContent`;

            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        contents: [
                            {
                                role: 'user',
                                parts: [{
                                    text: history.length
                                        ? `سياق المحادثة السابقة:\n${history
                                            .filter((item) => item?.text?.trim())
                                            .map((item) => `${item.role === 'user' ? 'المستخدم' : 'المساعد'}: ${item.text.trim()}`)
                                            .join('\n')}\n\nالرسالة الجديدة:\n${prompt.trim()}`
                                        : prompt.trim(),
                                }],
                            },
                        ],
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': this.apiKey,
                        },
                        timeout: 120000,
                    },
                ),
            );

            return (
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                'The AI returned an empty response.'
            );
        } catch (error: any) {
            const status = error?.response?.status;

            throw new HttpException(
                error?.response?.data?.error?.message ||
                    'Gemini API request failed',
                status || HttpStatus.BAD_GATEWAY,
            );
        }
    }
}
