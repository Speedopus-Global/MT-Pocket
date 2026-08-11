import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { connectChatSocket, getChatSocket } from '../lib/socket';
import {
  Send, Loader2, Check, CheckCheck, RefreshCw, MessageCircle, ChevronLeft,
} from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const PAGE_SIZE = 30;

function formatLastSeen(lastActiveAt) {
  if (!lastActiveAt) return 'Offline';
  const diffMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (diffMin < 1) return 'Last seen just now';
  if (diffMin < 60) return `Last seen ${Math.floor(diffMin)}m ago`;
  if (diffMin < 24 * 60) {
    return `Last seen ${new Date(lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Last seen ${new Date(lastActiveAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
}

// Reads the open thread from the URL (?conversationId=...) as the source of
// truth — this is what makes navigate(`/dashboard/messages?conversationId=X`)
// from an offer's "Message" button work, and makes refresh/back/forward and
// sharing a direct link to a thread all behave normally. A prop is still
// accepted for anyone embedding <Chat /> somewhere that isn't URL-driven.
export default function Chat({ initialConversationId = null }) {
  const { user, accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlConversationId = initialConversationId ?? searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(urlConversationId);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  // userId -> { online: boolean, lastActiveAt: string|null }
  const [presence, setPresence] = useState({});

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const activeConversation = conversations.find((c) => c.conversationId === activeId);

  // ── Socket bootstrap — one listener set for the whole page lifetime ─────
  useEffect(() => {
    if (!accessToken) return;
    let socket = getChatSocket();
    if (!socket || !socket.connected) socket = connectChatSocket(accessToken);
    socketRef.current = socket;

    const onNewMessage = (msg) => {
      setConversations((prev) => prev.map((c) => (
        c.conversationId === msg.conversationId
          ? { ...c, lastMessagePreview: msg.text, lastMessageAt: msg.createdAt }
          : c
      )));
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId !== user.id) socket.emit('mark_read', { conversationId: msg.conversationId });
      }
    };

    const onConversationUpdated = (data) => {
      setConversations((prev) => prev.map((c) => (
        c.conversationId === data.conversationId
          ? {
              ...c,
              lastMessagePreview: data.lastMessagePreview,
              lastMessageAt: data.lastMessageAt,
              unreadCount: data.conversationId === activeIdRef.current ? c.unreadCount : c.unreadCount + 1,
            }
          : c
      )));
    };

    const onPresence = ({ userId, online, lastActiveAt }) => {
      setPresence((prev) => ({
        ...prev,
        [userId]: { online, lastActiveAt: lastActiveAt ?? prev[userId]?.lastActiveAt ?? null },
      }));
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== user.id) setOtherTyping(isTyping);
    };

    const onReadReceipt = ({ conversationId, readAt }) => {
      if (conversationId !== activeIdRef.current) return;
      setMessages((prev) => prev.map((m) => (
        m.senderId === user.id ? { ...m, status: 'read', readAt } : m
      )));
    };

    socket.on('new_message', onNewMessage);
    socket.on('conversation_updated', onConversationUpdated);
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);
    socket.on('read_receipt', onReadReceipt);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('presence', onPresence);
      socket.off('typing', onTyping);
      socket.off('read_receipt', onReadReceipt);
    };
  }, [accessToken, user?.id]);

  // ── Conversation list ────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setLoadingList(true);
    api.getChatConversations(accessToken)
      .then(setConversations)
      .finally(() => setLoadingList(false));
  }, [accessToken]);

  // ── Open a thread ────────────────────────────────────────────────────
  // updateUrl=true when the user clicks a thread in the list (so the URL
  // reflects it, refresh-safe); false when we're just reacting to the URL
  // having already changed (avoids a redundant history entry).
  const openConversation = useCallback(async (conversationId, updateUrl = true) => {
    setActiveId(conversationId);
    setMessages([]);
    setHasMore(true);
    setOtherTyping(false);
    setLoadingMessages(true);

    if (updateUrl) setSearchParams({ conversationId }, { replace: true });

    socketRef.current?.emit('join_conversation', { conversationId });

    try {
      const history = await api.getChatMessages(conversationId, {}, accessToken);
      setMessages(history);
      setHasMore(history.length === PAGE_SIZE);
      setConversations((prev) => prev.map((c) => (
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      )));
      socketRef.current?.emit('mark_read', { conversationId });
    } finally {
      setLoadingMessages(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // React to the URL already carrying a conversationId — e.g. arriving via
  // navigate(`/dashboard/messages?conversationId=X`) from an offer's
  // "Message" button, or a page refresh/direct link.
  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeIdRef.current) {
      openConversation(urlConversationId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConversationId]);

  // Auto-scroll to bottom on new messages / thread open
  useEffect(() => {
    if (!loadingMessages) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loadingMessages]);

  // ── Load earlier messages — the "refresh" button pinned at the top ─────
  const loadOlder = async () => {
    if (!activeId || !messages.length) return;
    setLoadingOlder(true);
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    try {
      const older = await api.getChatMessages(activeId, { before: messages[0]._id }, accessToken);
      setHasMore(older.length === PAGE_SIZE);
      setMessages((prev) => [...older, ...prev]);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Typing ───────────────────────────────────────────────────────────
  const stopTyping = () => {
    if (activeId) socketRef.current?.emit('typing', { conversationId: activeId, isTyping: false });
    clearTimeout(typingTimeoutRef.current);
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    if (!activeId) return;
    socketRef.current?.emit('typing', { conversationId: activeId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1500);
  };

  // ── Send ─────────────────────────────────────────────────────────────
  const send = () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    socketRef.current?.emit('send_message', { conversationId: activeId, text }, () => {
      setSending(false);
    });
    setDraft('');
    stopTyping();
  };

  // Mobile back button — clears the open thread AND the query param
  const backToList = () => {
    setActiveId(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex-1 flex min-h-full rounded-2xl border border-border bg-card overflow-hidden shadow-md">
      {/* ── Conversation list ─────────────────────────────────────────── */}
      <div className={`w-full sm:w-80 shrink-0 border-r border-border flex-col ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-extrabold text-lg text-foreground">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-muted-foreground">
              <MessageCircle size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No conversations yet.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const other = c.otherParticipant;
              const isOnline = presence[other._id]?.online ?? false;
              return (
                <button
                  key={c.conversationId}
                  onClick={() => openConversation(c.conversationId)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/50 transition-colors border-b border-border/40 cursor-pointer ${
                    activeId === c.conversationId ? 'bg-muted/60' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={other.avatarUrl} />
                      <AvatarFallback>{other.fullName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground truncate">{other.fullName || 'User'}</span>
                      {c.lastMessageAt && (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{c.lastMessagePreview || 'Say hello 👋'}</span>
                      {c.unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* ── Thread ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
              <button
                onClick={backToList}
                className="sm:hidden p-1 -ml-1 text-muted-foreground cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <Avatar className="w-9 h-9">
                <AvatarImage src={activeConversation.otherParticipant.avatarUrl} />
                <AvatarFallback>{activeConversation.otherParticipant.fullName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {activeConversation.otherParticipant.fullName || 'User'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {otherTyping ? (
                    <span className="text-primary font-semibold">typing…</span>
                  ) : presence[activeConversation.otherParticipant._id]?.online ? (
                    <span className="text-emerald-600 font-semibold">Online</span>
                  ) : (
                    formatLastSeen(
                      presence[activeConversation.otherParticipant._id]?.lastActiveAt
                        ?? activeConversation.otherParticipant.lastActiveAt,
                    )
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
              {hasMore && messages.length > 0 && (
                <div className="flex justify-center mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="text-xs cursor-pointer"
                  >
                    {loadingOlder ? (
                      <Loader2 size={13} className="animate-spin mr-1.5" />
                    ) : (
                      <RefreshCw size={13} className="mr-1.5" />
                    )}
                    Load earlier messages
                  </Button>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {messages.map((m) => {
                    const isMine = m.senderId === user.id;
                    return (
                      <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 justify-end ${
                              isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            <span className="text-[10px]">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              m.status === 'read' ? (
                                <CheckCheck size={13} className="text-sky-300" />
                              ) : m.status === 'delivered' ? (
                                <CheckCheck size={13} />
                              ) : (
                                <Check size={13} />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Composer */}
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-border">
              <Input
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button
                onClick={send}
                disabled={!draft.trim() || sending}
                size="icon"
                className="cursor-pointer shrink-0"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}