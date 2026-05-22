"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What's my monthly payment on a $450,000 loan at 6.75% for 30 years?",
  "I earn $8,500/month and have $800 in debts. How much home can I afford?",
  "Compare FHA vs conventional loans for a $380,000 purchase.",
  "Show me the amortization schedule for a $300,000 loan at 6.5% for 15 years.",
  "Estimate closing costs on a $500,000 home in Georgia.",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Please check your API key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-apex-navy">
                Hi, I&apos;m Apex
              </h2>
              <p className="text-apex-muted max-w-md">
                Your AI mortgage advisor. Ask me anything about payments,
                affordability, loan types, or closing costs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-apex-gold hover:shadow-sm transition-all text-slate-600 hover:text-apex-navy"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-apex-navy flex items-center justify-center text-apex-gold font-bold text-xs shrink-0 mr-3 mt-1">
                  A
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-apex-navy text-white rounded-br-sm"
                    : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-apex-navy prose-strong:text-apex-navy">
                    <MarkdownContent content={msg.content} />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-apex-navy flex items-center justify-center text-apex-gold font-bold text-xs shrink-0 mr-3">
              A
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-apex-muted" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-4 py-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about payments, affordability, loan types…"
            className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apex-gold focus:border-transparent bg-slate-50 placeholder:text-slate-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-apex-navy text-apex-gold flex items-center justify-center hover:bg-apex-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          For illustrative purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        table: ({ ...props }) => (
          <div className="overflow-x-auto my-3">
            <table
              className="min-w-full text-xs border-collapse border border-slate-200"
              {...props}
            />
          </div>
        ),
        th: ({ ...props }) => (
          <th
            className="border border-slate-200 bg-apex-light px-3 py-2 text-left font-semibold text-apex-navy"
            {...props}
          />
        ),
        td: ({ ...props }) => (
          <td
            className="border border-slate-200 px-3 py-2"
            {...props}
          />
        ),
        code: ({ ...props }) => (
          <code
            className="bg-slate-100 rounded px-1 py-0.5 text-xs font-mono"
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
