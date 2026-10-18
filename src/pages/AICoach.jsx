import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  Dumbbell,
  Flame,
  Footprints,
  Apple,
  Clock,
  RotateCcw,
  MessageCircle,
  ChevronRight,
  Activity,
} from "lucide-react";
import api from "../services/api";

const suggestions = [
  {
    icon: Dumbbell,
    title: "Create a workout plan",
    prompt: "Create a beginner-friendly 30-minute workout plan.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Flame,
    title: "Burn more calories",
    prompt: "How can I burn calories safely and effectively?",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Footprints,
    title: "Improve my running",
    prompt: "Help me improve my running stamina as a beginner.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Apple,
    title: "Healthy eating tips",
    prompt: "Give me simple, healthy eating tips for fitness.",
    color: "bg-violet-50 text-violet-600",
  },
];

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! 👋 Main FitTrack AI hoon. Aap Hindi, Hinglish, English ya apni comfortable language mein baat kar sakte hain. Main aapke fitness, workout, running, recovery aur healthy habits ke questions mein help karunga. Aaj aap kya poochhna chahte hain?",
    time: getTime(),
  },
];

const normalizeReply = (data) => {
  if (typeof data === "string") return data.trim() || null;

  const candidates = [
    data?.reply,
    data?.answer,
    data?.response,
    data?.data?.reply,
    data?.data?.answer,
    data?.data?.response,
  ];

  return candidates.find(
    (value) => typeof value === "string" && value.trim()
  )?.trim() || null;
};

export default function AICoach() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiMode, setApiMode] = useState("checking");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (customMessage) => {
      const messageText = (customMessage ?? input).trim();

      if (!messageText || isLoading) return;

      const userMessage = {
        id: `${Date.now()}-user`,
        role: "user",
        content: messageText,
        time: getTime(),
      };

      setMessages((previous) => [...previous, userMessage]);
      setInput("");
      setError("");
      setIsLoading(true);

      try {
        // Backend should expose POST /api/coach/chat (or change this path
        // to match the route configured in your backend).
        // Send recent conversation history so follow-up questions have context.
        const history = messages
          .filter(
            (item) =>
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string" &&
              item.content.trim()
          )
          .slice(-10)
          .map(({ role, content }) => ({ role, content }));

        const response = await api.post("/coach/chat", {
          message: messageText,
          history,
        });

        const reply = normalizeReply(response.data);

        if (!reply) {
          throw new Error(
            "Coach API response mein reply/response/message/answer field nahi mila."
          );
        }

        setApiMode("api");

        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            content: reply,
            time: getTime(),
          },
        ]);
      } catch (err) {
        // Do not present a local keyword-based fallback as an AI answer.
        // Show the actual API error so configuration issues can be fixed.
        setApiMode("fallback");
        const apiError =
          err.response?.data?.message ||
          (err.response?.status
            ? `Request failed (HTTP ${err.response.status}).`
            : err.message) ||
          "Backend coach API request failed.";

        setError(`AI reply nahi mila. ${apiError}`);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([
      {
        id: `${Date.now()}-welcome`,
        role: "assistant",
        content:
          "Chat clear ho gayi! 👋 Aap Hindi, Hinglish, English ya apni comfortable language mein apna question poochh sakte hain.",
        time: getTime(),
      },
    ]);
    setInput("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#008F7A]">
              <Sparkles size={17} />
              Your Personal Fitness Assistant
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              AI Fitness Coach
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Get fitness guidance and build healthier habits.
            </p>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <RotateCcw size={16} />
            New Chat
          </button>
        </div>

        {/* Coach Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00B89C] via-teal-600 to-cyan-700 p-5 text-white sm:p-7">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-20 sm:w-20">
              <Bot size={42} />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold sm:text-xl">
                  Your Fitness Companion
                </h2>

                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
                  {apiMode === "api"
                    ? "API Connected"
                    : apiMode === "fallback"
                    ? "Connection error"
                    : "Ready to connect"}
                </span>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-white/90">
                Hindi, Hinglish, English, ya apni pasand ki language mein
                poochhein. Coach aapki language mein jawab dene ki koshish
                karega.
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Chat Section */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                  <MessageCircle size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">Fitness Chat</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        apiMode === "api"
                          ? "bg-emerald-500"
                          : apiMode === "fallback"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {apiMode === "api"
                      ? "Backend coach connected"
                      : apiMode === "fallback"
                      ? "Last request failed; check the error below"
                      : "Connection will be checked when you send a message"}
                  </p>
                </div>
              </div>

              <span className="text-xs text-gray-400">
                {messages.length} messages
              </span>
            </div>

            {/* Messages */}
            <div
              className="flex h-[420px] flex-col gap-5 overflow-y-auto p-4 sm:h-[480px] sm:p-6"
              aria-live="polite"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isUser
                          ? "bg-gray-900 text-white"
                          : "bg-[#00B89C]/10 text-[#008F7A]"
                      }`}
                    >
                      {isUser ? <User size={19} /> : <Bot size={20} />}
                    </div>

                    <div
                      className={`max-w-[85%] ${isUser ? "text-right" : ""}`}
                    >
                      <div
                        className={`mb-1.5 flex items-center gap-2 text-xs text-gray-400 ${
                          isUser ? "justify-end" : ""
                        }`}
                      >
                        <span className="font-semibold text-gray-700">
                          {isUser ? "You" : "Fitness Coach"}
                        </span>
                        <span>{message.time}</span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-left text-sm leading-6 ${
                          isUser
                            ? "rounded-tr-sm bg-[#008F7A] text-white"
                            : "rounded-tl-sm bg-gray-100 text-gray-700"
                        }`}
                      >
                        <p className="whitespace-pre-line break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B89C]/10 text-[#008F7A]">
                    <Bot size={20} />
                  </div>

                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            <div className="border-t border-gray-100 px-4 pt-4 sm:px-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Try asking
              </p>

              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;

                  return (
                    <button
                      key={suggestion.title}
                      type="button"
                      disabled={isLoading}
                      onClick={() => sendMessage(suggestion.prompt)}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-[#00B89C]/50 hover:bg-[#00B89C]/5 disabled:opacity-50"
                    >
                      <Icon size={15} className="text-[#008F7A]" />
                      {suggestion.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-100 bg-gray-50 p-4 sm:p-5"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 transition focus-within:border-[#00B89C] focus-within:ring-2 focus-within:ring-[#00B89C]/10">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  placeholder="Ask your fitness coach..."
                  rows={1}
                  maxLength={4000}
                  className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  aria-label="Message your fitness coach"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00B89C] text-white transition hover:bg-[#009F87] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  <Send size={18} />
                </button>
              </div>

              {error && (
                <p
                  role="status"
                  className="mt-2 text-center text-xs text-amber-700"
                >
                  {error}
                </p>
              )}

              <p className="mt-2 text-center text-xs text-gray-400">
                Fitness suggestions are for general information and are not
                medical advice.
              </p>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={19} className="text-[#008F7A]" />
                <h2 className="font-bold text-gray-900">Quick Suggestions</h2>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;

                  return (
                    <button
                      key={suggestion.title}
                      type="button"
                      disabled={isLoading}
                      onClick={() => sendMessage(suggestion.prompt)}
                      className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-[#00B89C]/30 hover:bg-[#00B89C]/5 disabled:opacity-50"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${suggestion.color}`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {suggestion.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                          {suggestion.prompt}
                        </p>
                      </div>

                      <ChevronRight
                        size={17}
                        className="shrink-0 text-gray-400"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={19} className="text-[#008F7A]" />
                <h2 className="font-bold text-gray-900">Fitness Reminders</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Stay consistent
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Build a routine that fits your schedule and current
                      fitness level.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Warm up first
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Start exercise sessions gently and increase intensity
                      gradually.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Make time to recover
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Balance training with rest, sleep, and nutritious meals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs leading-5 text-amber-800">
                <strong>Note:</strong> This chat needs the backend coach
                endpoint and a valid OpenAI API configuration. If a request
                fails, check the error shown below the message box. For
                personalized medical or nutrition advice, consult a qualified
                professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
