"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchChatConversations, fetchChatThread, fetchChatThreadSince, markChatThreadRead, sendChatMessage } from "@/lib/api"
import { ChatMessageResponse, ConversationSummary } from "@/lib/types"
import { AlertTriangle, MessageCircle, Send, User, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

const CONVERSATIONS_POLL_MS = 10000
const THREAD_POLL_MS = 5000
const PAGE_SIZE = 30

export function ChatPanel() {
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [threadError, setThreadError] = useState(false)

    const [messages, setMessages] = useState<ChatMessageResponse[]>([])
    const [loadingThread, setLoadingThread] = useState(false)
    const [text, setText] = useState("")
    const [sending, setSending] = useState(false)
    const lastIdRef = useRef(0)
    // Separate from lastIdRef being 0 — that's also the legitimate value for "thread has zero
    // messages", so it can't double as an "initial load succeeded" flag.
    const initializedRef = useRef(false)
    // Bumped on every conversation switch — an in-flight request from a conversation the admin
    // has since switched away from checks this before applying its result, so a slow response for
    // conversation A can never land on screen while B is now selected.
    const requestIdRef = useRef(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const loadConversations = useCallback(async () => {
        try {
            setConversations(await fetchChatConversations())
        } catch (e) {
            console.error("Failed to fetch conversations", e)
        } finally {
            setLoadingConversations(false)
        }
    }, [])

    useEffect(() => {
        loadConversations()
        const interval = setInterval(loadConversations, CONVERSATIONS_POLL_MS)
        return () => clearInterval(interval)
    }, [loadConversations])

    const loadThread = useCallback(async (otherUserId: number, requestId: number) => {
        setLoadingThread(true)
        try {
            const page = await fetchChatThread(otherUserId, 0, PAGE_SIZE)
            if (requestIdRef.current !== requestId) return
            const ascending = [...page.content].reverse()
            setMessages(ascending)
            lastIdRef.current = ascending.length > 0 ? ascending[ascending.length - 1].id : 0
            initializedRef.current = true
            setThreadError(false)
            await markChatThreadRead(otherUserId)
            loadConversations()
        } catch (e) {
            if (requestIdRef.current !== requestId) return
            console.error("Failed to fetch thread", e)
            setThreadError(true)
        } finally {
            if (requestIdRef.current === requestId) setLoadingThread(false)
        }
    }, [loadConversations])

    useEffect(() => {
        if (selectedId == null) return
        const requestId = ++requestIdRef.current
        // Clear immediately rather than leaving the previous conversation's messages on screen —
        // otherwise, until this fetch resolves (or forever, if it fails), they'd render under the
        // NEW conversation's header and the composer would misdirect a reply to the new recipient.
        setMessages([])
        setThreadError(false)
        lastIdRef.current = 0
        initializedRef.current = false
        loadThread(selectedId, requestId)

        const interval = setInterval(async () => {
            if (requestIdRef.current !== requestId) return
            if (!initializedRef.current) {
                // Initial load never succeeded — retry it instead of since-polling, which would
                // otherwise silently no-op forever (lastIdRef stuck at 0 either way).
                await loadThread(selectedId, requestId)
                return
            }
            try {
                const fresh = await fetchChatThreadSince(selectedId, lastIdRef.current)
                if (requestIdRef.current !== requestId) return
                if (fresh.length > 0) {
                    setMessages((prev) => {
                        const seen = new Set(prev.map((m) => m.id))
                        const deduped = fresh.filter((m) => !seen.has(m.id))
                        return deduped.length > 0 ? [...prev, ...deduped] : prev
                    })
                    lastIdRef.current = fresh[fresh.length - 1].id
                    markChatThreadRead(selectedId).catch(() => undefined)
                    loadConversations()
                }
            } catch {
                // try again next tick
            }
        }, THREAD_POLL_MS)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async () => {
        const body = text.trim()
        if (!body || sending || selectedId == null) return
        setSending(true)
        setText("")
        try {
            const sent = await sendChatMessage({ recipientId: selectedId, text: body })
            // A poll tick already in flight when this resolves can independently fetch the same
            // message via fetchChatThreadSince — dedupe by id rather than assume this is the only
            // place that ever appends it.
            setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
            lastIdRef.current = Math.max(lastIdRef.current, sent.id)
        } catch (e) {
            console.error("Failed to send message", e)
            toast.error("Failed to send message")
            setText(body)
        } finally {
            setSending(false)
        }
    }

    const selected = conversations.find((c) => c.otherUserId === selectedId)

    return (
        <div className="flex h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            {/* Conversations */}
            <div className="w-[340px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                <div className="px-5 pt-6 pb-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <MessageCircle className="w-4.5 h-4.5" />
                        </div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Chat</h2>
                    </div>
                    <button
                        onClick={loadConversations}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-500"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loadingConversations ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400 px-4 text-center">
                            <MessageCircle size={22} />
                            <p className="text-xs">No conversations yet — parents and students can start one from the mobile app.</p>
                        </div>
                    ) : (
                        conversations.map((c) => (
                            <button
                                key={c.otherUserId}
                                onClick={() => setSelectedId(c.otherUserId)}
                                className={`w-full text-left px-5 py-3 border-b border-slate-100 hover:bg-blue-50/40 transition-colors ${selectedId === c.otherUserId ? "bg-blue-50" : ""
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-800 truncate">{c.otherUserName}</span>
                                    {c.unreadCount > 0 && (
                                        <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessageText}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Thread */}
            <div className="flex-1 min-w-0 flex flex-col">
                {selectedId == null ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        Select a conversation
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-900">{selected?.otherUserName ?? "Conversation"}</h3>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
                            {loadingThread ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : threadError && messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                    <AlertTriangle size={22} />
                                    <p className="text-xs">Could not load this conversation. Retrying automatically…</p>
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const mine = String(m.senderId) !== String(selectedId)
                                    return (
                                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                                                    }`}
                                            >
                                                {m.text}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-white flex items-end gap-2">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                                rows={1}
                                placeholder="Type a message..."
                                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !text.trim()}
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shrink-0"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
