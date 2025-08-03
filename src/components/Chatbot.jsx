import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', type: 'text', content: 'Hi! Ask me to find grants for your projects.' },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', type: 'text', content: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        setMessages((prev) => [...prev, { role: 'assistant', type: 'text', content: 'Searching grants...' }]);

        try {
            const response = await fetch('https://grant-search-server.vercel.app/api/search-grants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: input.trim() }),
            });

            if (!response.ok) throw new Error('Failed to fetch grants');

            const data = await response.json();

            setMessages((prev) => prev.filter((msg) => msg.content !== 'Searching grants...'));

            if (data.grants && data.grants.length > 0) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        type: 'grants',
                        content: data.grants,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', type: 'text', content: 'Sorry, I could not find any matching grants.' },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', type: 'text', content: 'Oops, something went wrong. Please try again later.' },
            ]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50"
                    aria-label="Open chatbot"
                    title="Chat with AI assistant"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 max-w-full h-96 bg-white shadow-xl rounded-lg flex flex-col z-50">
                    <header className="flex justify-between items-center p-3 border-b border-gray-200">
                        <h2 className="font-semibold text-lg text-gray-700">Grant Finder Assistant</h2>
                        <button
                            onClick={toggleChat}
                            aria-label="Close chatbot"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                    </header>

                    <main className="flex-grow p-3 overflow-y-auto space-y-3">
                        {messages.map((msg, i) => {
                            const isUser = msg.role === 'user';
                            const baseClasses = `max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap`;

                            if (msg.type === 'grants') {
                                return (
                                    <div
                                        key={i}
                                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`bg-gray-100 text-gray-900 ${baseClasses} border border-gray-300`}
                                        >
                                            <p className="font-semibold mb-1">Here are some grants I found:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                {msg.content.map((grant) => (
                                                    <li key={grant.id}>
                                                        <a
                                                            href={grant.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {grant.title}
                                                        </a>
                                                        <br />
                                                        <small>
                                                            {grant.agency} | Open: {grant.openDate} | Close: {grant.closeDate || 'TBD'}
                                                        </small>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={i}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} ${baseClasses}`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </main>

                    <footer className="p-3 border-t border-gray-200">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="flex gap-2"
                        >
              <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to find grants..."
                  className="flex-grow resize-none rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  style={{color: 'white'}}
              />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2 flex items-center justify-center"
                                aria-label="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
};

export default Chatbot;
