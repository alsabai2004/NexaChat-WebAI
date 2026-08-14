import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import useFetchModels from "@/hooks/useFetchModels.tsx";
import useApiHeartbeat from "@/hooks/useHeartbeat.tsx";
import useSendMessage from "@/hooks/useSendMessage.tsx";
import ErrorModal from "@/components/ui/error-modal.tsx";
import { Loader } from "@/components/ui/loader.tsx";
import { Timer } from "@/components/ui/timer.tsx";
import { StatusDot } from "@/components/ui/status-dot.tsx";
import { ModelSelector } from "@/components/ui/model-selector.tsx";
import { CloseButton } from "@/components/ui/close-button.tsx";
import { ChatMessage } from "@/components/ui/chat-message.tsx";
import FaviconHandler from "@/components/favicon-handler.tsx";

export default function ChatWidget() {
    const { isApiAlive } = useApiHeartbeat(1000);
    const {
        models,
        selectedModel,
        selectModel,
        error: modelsError,
    } = useFetchModels();

    const [query, setQuery] = useState("");
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("nexachat_theme") === "dark";
    });

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const {
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
    } = useSendMessage(setQuery);

    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem(
            "nexachat_theme",
            darkMode ? "dark" : "light",
        );
    }, [darkMode]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "smooth",
            });
        }

        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [messages, selectedModel]);

    useEffect(() => {
        if (error) {
            setIsErrorModalOpen(true);
        }
    }, [error]);

    const handleCloseErrorModal = () => {
        setIsErrorModalOpen(false);
        setError(null);
    };

    const handleClearChat = () => {
        if (!window.confirm("Clear the current chat?")) {
            return;
        }

        clearCurrentChat();
    };

    const handleNewChat = () => {
        newConversation();
        inputRef.current?.focus();
    };

    const handleDeleteChat = (
        event: React.MouseEvent,
        id: string,
    ) => {
        event.stopPropagation();

        if (!window.confirm("Delete this conversation?")) {
            return;
        }

        deleteConversation(id);
    };

    return (
        <>
            <FaviconHandler isApiAlive={isApiAlive} />

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                errorMessage={error || modelsError || ""}
            />

            <div className="min-h-screen bg-background p-4">
                <div className="flex items-center justify-between max-w-5xl mx-auto mb-3">
                    <div className="text-lg font-semibold">
                        NexaChat WebAI
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setDarkMode(!darkMode)}
                            className="text-sm px-3 py-1 rounded border"
                        >
                            {darkMode ? "☀️ Light" : "🌙 Dark"}
                        </button>

                        <button
                            type="button"
                            onClick={handleClearChat}
                            className="text-sm px-3 py-1 rounded border"
                        >
                            Clear Chat
                        </button>
                    </div>
                </div>

                <div className="flex h-[600px] w-full max-w-5xl mx-auto bg-background rounded-lg shadow-lg overflow-hidden border">
                    {sidebarOpen && (
                        <aside className="w-64 border-r bg-muted/40 flex flex-col">
                            <div className="p-3">
                                <Button
                                    className="w-full"
                                    onClick={handleNewChat}
                                    disabled={loading}
                                >
                                    + New Chat
                                </Button>
                            </div>

                            <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
                                Conversations
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
                                {conversations.map((conversation) => {
                                    const active =
                                        conversation.id === activeId;

                                    return (
                                        <div
                                            key={conversation.id}
                                            onClick={() =>
                                                selectConversation(
                                                    conversation.id,
                                                )
                                            }
                                            className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                                                active
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate text-sm">
                                                    {conversation.title}
                                                </div>

                                                <div
                                                    className={`text-xs ${
                                                        active
                                                            ? "opacity-70"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {conversation.messages.length}{" "}
                                                    messages
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    handleDeleteChat(
                                                        event,
                                                        conversation.id,
                                                    )
                                                }
                                                className="opacity-0 group-hover:opacity-100 text-xs px-1"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t p-3 text-xs text-muted-foreground">
                                Gemini AI
                            </div>
                        </aside>
                    )}

                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSidebarOpen(!sidebarOpen)
                                    }
                                    className="text-lg px-1"
                                    title="Toggle conversations"
                                >
                                    ☰
                                </button>

                                <div className="relative">
                                    <StatusDot
                                        isApiAlive={isApiAlive}
                                    />
                                    <h2 className="text-lg font-medium ml-5">
                                        Chat
                                    </h2>
                                </div>

                                <Timer isApiAlive={isApiAlive} />
                            </div>

                            <div className="flex items-center gap-2">
                                <ModelSelector
                                    selectedModel={selectedModel}
                                    selectModel={selectModel}
                                    models={models}
                                    isApiAlive={isApiAlive}
                                />

                                <CloseButton setError={setError} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message, index) => (
                                <ChatMessage
                                    key={`${activeId}-${index}-${message.type}`}
                                    index={`${index}-${message.type}`}
                                    message={message}
                                />
                            ))}

                            <Loader loading={loading} />

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="flex items-center px-4 py-3 bg-muted">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your message"
                                className="flex-1 mr-2 rounded-lg border-none focus:ring-0"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                onKeyPress={(event) =>
                                    event.key === "Enter" &&
                                    handleSend(query)
                                }
                                disabled={
                                    loading || !isApiAlive
                                }
                            />

                            <Button
                                className="rounded-lg"
                                onClick={() => handleSend(query)}
                                disabled={
                                    loading || !isApiAlive
                                }
                            >
                                {loading ? "Sending..." : "Send"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
