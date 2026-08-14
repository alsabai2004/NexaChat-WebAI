import { Body, Controller, Post } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) {}

    @Post('send')
    async sendMessage(
        @Body('text') text: string,
        @Body('history') history: { role: 'user' | 'model'; text: string }[] = [],
    ): Promise<string> {
        return this.geminiService.sendMessage(text, history);
    }
}
