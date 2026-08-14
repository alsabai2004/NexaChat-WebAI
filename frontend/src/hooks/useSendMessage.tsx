import { useEffect } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { BACKEND_URL } from '@/utils/constants.ts';

interface IMessage {
    type: 'user' | 'server';
    content: string;
}

interface OllamaResponse {
    response?: string;
    model?: string;
    done?: boolean;
    error?: string;
}

const useSendMessage = (
    setQuery: React.Dispatch<React.SetStateAction<string>>,
) => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (query: string, selectedModel: string) => {
        const cleanQuery = query.trim();

        if (!cleanQuery || !selectedModel) {
            setError('Please enter a message and select a model.');
            return;
        }

        if (loading) return;

        setLoading(true);
        setError(null);

        setMessages((prev) => [
            ...prev,
            { type: 'user', content: cleanQuery },
            { type: 'server', content: '' },
        ]);

        setQuery('');

        try {
            const response = await fetch(`${BACKEND_URL}/ollama/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    query: cleanQuery,
                }),
            });

            const contentType = response.headers.get('content-type') || '';
            let responseText = '';

            if (!response.ok) {
                let message = `Request failed (${response.status})`;

                try {
                    if (contentType.includes('application/json')) {
                        const errorData = await response.json();
                        message =
                            errorData?.message ||
                            errorData?.error ||
                            message;
                    } else {
                        const text = await response.text();
                        if (text.trim()) message = text;
                    }
                } catch {
                    // Keep the default error message.
                }

                throw new Error(message);
            }

            if (contentType.includes('application/json')) {
                const data: OllamaResponse = await response.json();
                responseText = data.response || data.error || '';
            } else if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    for (const line of chunk.split('\n')) {
                        if (!line.trim()) continue;

                        try {
                            const data: OllamaResponse = JSON.parse(line);
                            responseText += data.response || '';
                        } catch {
                            responseText += line;
                        }
                    }

                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;

                        if (updated[lastIndex]?.type === 'server') {
                            updated[lastIndex] = {
                                type: 'server',
                                content: responseText,
                            };
                        }

                        return updated;
                    });
                }
            }

            setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (updated[lastIndex]?.type === 'server') {
                    updated[lastIndex] = {
                        type: 'server',
                        content:
                            responseText ||
                            'The AI returned an empty response.',
                    };
                }

                return updated;
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'An unexpected error occurred.';

            console.error('Chat request error:', err);
            setError(message);

            setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (updated[lastIndex]?.type === 'server') {
                    updated[lastIndex] = {
                        type: 'server',
                        content: `⚠️ ${message}`,
                    };
                }

                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        messages,
        loading,
        error,
        handleSend,
        setError,
    };
};

export default useSendMessage;
