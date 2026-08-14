import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/utils/constants.ts';

interface IMessage {
    type: 'user' | 'server';
    content: string;
}

interface IConversation {
    id: string;
    title: string;
    messages: IMessage[];
    createdAt: number;
}

const STORAGE_KEY = 'nexachat_conversations';
const ACTIVE_KEY = 'nexachat_active_conversation';

export const clearSavedMessages = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_KEY);
    } catch {
        // Ignore storage errors
    }
};

const createConversation = (): IConversation => ({
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
});

const loadConversations = (): IConversation[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Ignore storage errors
    }

    return [createConversation()];
};

const loadActiveId = (conversations: IConversation[]) => {
    const saved = localStorage.getItem(ACTIVE_KEY);

    if (saved && conversations.some((chat) => chat.id === saved)) {
        return saved;
    }

    return conversations[0].id;
};

const useSendMessage = (
    setQuery: React.Dispatch<React.SetStateAction<string>>,
) => {
    const [conversations, setConversations] =
        useState<IConversation[]>(loadConversations);

    const [activeId, setActiveId] = useState<string>(() =>
        loadActiveId(conversations),
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeConversation =
        conversations.find((chat) => chat.id === activeId) ||
        conversations[0];

    const messages = activeConversation?.messages || [];

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }, [conversations]);

    useEffect(() => {
        localStorage.setItem(ACTIVE_KEY, activeId);
    }, [activeId]);

    const newConversation = () => {
        const chat = createConversation();

        setConversations((prev) => [chat, ...prev]);
        setActiveId(chat.id);
        setQuery('');
        setError(null);
    };

    const selectConversation = (id: string) => {
        setActiveId(id);
        setQuery('');
        setError(null);
    };

    const deleteConversation = (id: string) => {
        setConversations((prev) => {
            const remaining = prev.filter((chat) => chat.id !== id);

            if (remaining.length === 0) {
                const fresh = createConversation();
                setActiveId(fresh.id);
                return [fresh];
            }

            if (id === activeId) {
                setActiveId(remaining[0].id);
            }

            return remaining;
        });

        setQuery('');
    };

    const handleSend = async (query: string) => {
        const cleanQuery = query.trim();

        if (!cleanQuery) {
            setError('Please enter a message.');
            return;
        }

        if (loading || !activeConversation) return;

        setLoading(true);
        setError(null);

        const history = messages
            .filter((message) => message.content.trim())
            .map((message) => ({
                role: message.type === 'user' ? 'user' : 'model',
                text: message.content,
            }));

        const userMessage: IMessage = {
            type: 'user',
            content: cleanQuery,
        };

        const emptyResponse: IMessage = {
            type: 'server',
            content: '',
        };

        setConversations((prev) =>
            prev.map((chat) =>
                chat.id === activeId
                    ? {
                          ...chat,
                          title:
                              chat.messages.length === 0
                                  ? cleanQuery.slice(0, 35)
                                  : chat.title,
                          messages: [
                              ...chat.messages,
                              userMessage,
                              emptyResponse,
                          ],
                      }
                    : chat,
            ),
        );

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
                    history,
                }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(
                    message || `Request failed (${response.status})`,
                );
            }

            const responseText = await response.text();

            setConversations((prev) =>
                prev.map((chat) => {
                    if (chat.id !== activeId) return chat;

                    const updated = [...chat.messages];
                    const lastIndex = updated.length - 1;

                    if (updated[lastIndex]?.type === 'server') {
                        updated[lastIndex] = {
                            type: 'server',
                            content:
                                responseText ||
                                'The AI returned an empty response.',
                        };
                    }

                    return {
                        ...chat,
                        messages: updated,
                    };
                }),
            );
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'An unexpected error occurred.';

            console.error('Chat request error:', err);
            setError(message);

            setConversations((prev) =>
                prev.map((chat) => {
                    if (chat.id !== activeId) return chat;

                    const updated = [...chat.messages];
                    const lastIndex = updated.length - 1;

                    if (updated[lastIndex]?.type === 'server') {
                        updated[lastIndex] = {
                            type: 'server',
                            content: `⚠️ ${message}`,
                        };
                    }

                    return {
                        ...chat,
                        messages: updated,
                    };
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    const clearCurrentChat = () => {
        setConversations((prev) =>
            prev.map((chat) =>
                chat.id === activeId
                    ? {
                          ...chat,
                          title: 'New Chat',
                          messages: [],
                      }
                    : chat,
            ),
        );

        setQuery('');
        setError(null);
    };

    return {
        messages,
        loading,
        error,
        handleSend,
        setError,
        conversations,
        activeId,
        newConversation,
        selectConversation,
        deleteConversation,
        clearCurrentChat,
    };
};

export default useSendMessage;
