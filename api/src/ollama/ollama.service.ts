import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaService {
    private readonly ollamaApiUrl: string;

    constructor(
        private readonly httpService: HttpService,
        configService: ConfigService,
    ) {
        this.ollamaApiUrl =
            configService.get<string>('OLLAMA_API_URL')?.replace(/\/+$/, '') ||
            'http://localhost:11434';
    }

    async fetchOllamaData(model: string, prompt: string): Promise<any> {
        if (!model?.trim()) {
            throw new HttpException(
                'AI model is required',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!prompt?.trim()) {
            throw new HttpException(
                'Message cannot be empty',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (prompt.length > 10000) {
            throw new HttpException(
                'Message is too long. Maximum length is 10000 characters.',
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.ollamaApiUrl}/api/generate`,
                    {
                        model: model.trim(),
                        prompt: prompt.trim(),
                        stream: false,
                    },
                    {
                        timeout: 120000,
                    },
                ),
            );

            return {
                response: response.data?.response ?? '',
                model: response.data?.model ?? model,
                done: response.data?.done ?? true,
                total_duration: response.data?.total_duration,
                eval_count: response.data?.eval_count,
            };
        } catch (error: any) {
            const status = error?.response?.status;

            if (error?.code === 'ECONNABORTED') {
                throw new HttpException(
                    'Ollama request timed out. The model may still be loading.',
                    HttpStatus.GATEWAY_TIMEOUT,
                );
            }

            if (error?.code === 'ECONNREFUSED' || !error?.response) {
                throw new HttpException(
                    'Cannot connect to Ollama. Make sure Ollama is running.',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }

            throw new HttpException(
                error?.response?.data?.error ||
                    error?.response?.data ||
                    'Ollama API request failed',
                status || HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async fetchAvailableModels(): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.ollamaApiUrl}/api/tags`, {
                    timeout: 15000,
                }),
            );

            return response.data;
        } catch (error: any) {
            if (error?.code === 'ECONNREFUSED' || !error?.response) {
                throw new HttpException(
                    'Cannot connect to Ollama. Make sure Ollama is running.',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }

            throw new HttpException(
                error?.response?.data?.error ||
                    'Failed to fetch Ollama models',
                error?.response?.status || HttpStatus.BAD_GATEWAY,
            );
        }
    }
}
