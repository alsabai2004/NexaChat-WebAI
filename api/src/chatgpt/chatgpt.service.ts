import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatgptService {
    private readonly apiUrl = 'https://api.openai.com/v1/responses';
    private readonly apiKey: string;
    private readonly model: string;

    constructor(
        private readonly httpService: HttpService,
        configService: ConfigService,
    ) {
        this.apiKey = configService.get<string>('OPENAI_API_KEY') || '';
        this.model = configService.get<string>('OPENAI_MODEL') || 'gpt-5';
    }

    async sendMessage(prompt: string): Promise<string> {
        if (!prompt?.trim()) {
            throw new HttpException(
                'Message cannot be empty',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!this.apiKey) {
            throw new HttpException(
                'OPENAI_API_KEY is not configured',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    this.apiUrl,
                    {
                        model: this.model,
                        input: prompt.trim(),
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.apiKey}`,
                        },
                        timeout: 120000,
                    },
                ),
            );

            return response.data?.output_text || 'The AI returned an empty response.';
        } catch (error: any) {
            throw new HttpException(
                error?.response?.data?.error?.message ||
                    'OpenAI API request failed',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }
}
