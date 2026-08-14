import { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/utils/constants.ts';

const NEXACHAT_MESSAGES = 'nexachat_messages';

export const loadSavedMessages = () => {
    try {
        const saved = localStorage.getItem(NEXACHAT_MESSAGES);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

export const saveMessages = (messages: unknown[]) => {
    try {
        localStorage.setItem(NEXACHAT_MESSAGES, JSON.stringify(messages));
    } catch {
        // Ignore localStorage errors
    }
};

export const clearSavedMessages = () => {
    try {
        localStorage.removeItem(NEXACHAT_MESSAGES);
    } catch {
        // Ignore localStorage errors
    }
};


interface IMessage {
    type: 'user' | 'server';
    content: string;
}


const useSendMessage = (
    setQuery: React.Dispatch<React.SetStateAction<string>>,
) => {
    const [messages, setMessages] = useState<IMessage[]>(loadSavedMessages());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async (query: string) => {
        const cleanQuery = query.trim();

        if (!cleanQuery) {
            setError('Please enter a message.');
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
            const response = await fetch(`${BACKEND_URL}/gemini/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain',
                },
                body: JSON.stringify({
                    text: cleanQuery,
                    history: messages.map((message) => ({
                        role: message.type === 'user' ? 'user' : 'model',
                        text: message.content,
                    })),
                }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `Request failed (${response.status})`);
            }

            const responseText = await response.text();

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

    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    return {
        messages,
        loading,
        error,
        handleSend,
        setError,
    };
};

export default useSendMessage;
