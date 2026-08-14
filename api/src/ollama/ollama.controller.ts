import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OllamaService } from './ollama.service';

@ApiTags('ollama')
@Controller('ollama')
export class OllamaController {
    constructor(private readonly ollamaService: OllamaService) {}

    @Post('query')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    example: 'llama3.2',
                },
                query: {
                    type: 'string',
                    example: 'Explain computer networks simply.',
                },
            },
            required: ['model', 'query'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'AI response generated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid model or message',
    })
    @ApiResponse({
        status: 503,
        description: 'Ollama is unavailable',
    })
    async queryOllama(
        @Body('model') model: string,
        @Body('query') query: string,
    ): Promise<any> {
        if (!model?.trim()) {
            throw new BadRequestException('Model is required');
        }

        if (!query?.trim()) {
            throw new BadRequestException('Message cannot be empty');
        }

        return this.ollamaService.fetchOllamaData(model, query);
    }

    @Get('models')
    @ApiResponse({
        status: 200,
        description: 'Returns all locally installed Ollama models',
    })
    async getAvailableModels(): Promise<any> {
        return this.ollamaService.fetchAvailableModels();
    }
}
