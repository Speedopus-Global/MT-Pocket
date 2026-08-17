import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { connectChatSocket, getChatSocket } from '../lib/socket';
import {
  Send, Loader2, Check, CheckCheck, RefreshCw, MessageCircle, ChevronLeft,
  Paperclip, Image as ImageIcon, FileText, MoreVertical, Edit2, Trash2, Smile, X, Download, AlertCircle
} from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 30;
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function formatChatDay(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatConversationListTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatLastSeenWhatsApp(lastActiveAt) {
  if (!lastActiveAt) return 'offline';
  const date = new Date(lastActiveAt);
  const now = new Date();
  const diffMin = (now.getTime() - date.getTime()) / 60000;
  if (diffMin < 1) return 'last seen just now';
  if (diffMin < 5) return 'last seen moments ago';

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayStr = formatChatDay(lastActiveAt);

  if (dayStr === 'Today') return `last seen today at ${timeStr}`;
  if (dayStr === 'Yesterday') return `last seen yesterday at ${timeStr}`;
  if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayStr)) {
    return `last seen ${dayStr} at ${timeStr}`;
  }
  return `last seen on ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} at ${timeStr}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  // userId -> { online: boolean, lastActiveAt: string|null }
  const [presence, setPresence] = useState({});

  // Editing state
  const [editingMessage, setEditingMessage] = useState(null); // { id, text }
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const activeConversation = conversations.find((c) => c.conversationId === activeId);

  // ── Socket bootstrap ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    let socket = getChatSocket();
    if (!socket || !socket.connected) socket = connectChatSocket(accessToken);
    socketRef.current = socket;

    const onNewMessage = (msg) => {
      let preview = msg.text;
      if (!preview && msg.mediaUrl) {
        preview = msg.mediaType === 'image' ? '📷 Photo' : `📎 ${msg.fileName || 'Attachment'}`;
      }

      setConversations((prev) => prev.map((c) => (
        c.conversationId === msg.conversationId
          ? { ...c, lastMessagePreview: preview, lastMessageAt: msg.createdAt }
          : c
      )));

      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId !== user?.id) {
          socket.emit('mark_read', { conversationId: msg.conversationId });
        }
      }
    };

    const onConversationUpdated = (data) => {
      setConversations((prev) => prev.map((c) => (
        c.conversationId === data.conversationId
          ? {
              ...c,
              lastMessagePreview: data.lastMessagePreview,
              lastMessageAt: data.lastMessageAt,
              unreadCount: data.conversationId === activeIdRef.current ? c.unreadCount : (c.unreadCount || 0) + 1,
            }
          : c
      )));
    };

    const onMessageEdited = ({ messageId, text, isEdited, editedAt }) => {
      setMessages((prev) => prev.map((m) => (
        m._id === messageId ? { ...m, text, isEdited, editedAt } : m
      )));
    };

    const onMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => (
        m._id === messageId ? { ...m, reactions } : m
      )));
    };

    const onPresence = ({ userId, online, lastActiveAt }) => {
      setPresence((prev) => ({
        ...prev,
        [userId]: { online, lastActiveAt: lastActiveAt ?? prev[userId]?.lastActiveAt ?? null },
      }));
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== user?.id) setOtherTyping(isTyping);
    };

    const onReadReceipt = ({ conversationId, readAt }) => {
      if (conversationId !== activeIdRef.current) return;
      setMessages((prev) => prev.map((m) => (
        m.senderId === user?.id ? { ...m, status: 'read', readAt } : m
      )));
    };

    socket.on('new_message', onNewMessage);
    socket.on('conversation_updated', onConversationUpdated);
    socket.on('message_edited', onMessageEdited);
    socket.on('message_reacted', onMessageReacted);
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);
    socket.on('read_receipt', onReadReceipt);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('message_edited', onMessageEdited);
      socket.off('message_reacted', onMessageReacted);
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
  const openConversation = useCallback(async (conversationId, updateUrl = true) => {
    setActiveId(conversationId);
    setMessages([]);
    setHasMore(true);
    setOtherTyping(false);
    setEditingMessage(null);
    setActiveMenuMessageId(null);
    setReactionPickerMessageId(null);
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
  }, [accessToken, setSearchParams]);

  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeIdRef.current) {
      openConversation(urlConversationId, false);
    }
  }, [urlConversationId, openConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!loadingMessages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loadingMessages]);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuMessageId(null);
      setReactionPickerMessageId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // ── Load earlier messages ────────────────────────────────────────────
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

  // ── Send text ────────────────────────────────────────────────────────
  const send = () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;

    if (editingMessage) {
      // Save edited message
      submitEdit();
      return;
    }

    setSending(true);
    socketRef.current?.emit('send_message', { conversationId: activeId, text }, () => {
      setSending(false);
    });
    setDraft('');
    stopTyping();
  };

  // ── File & Image Upload ──────────────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    setUploadingMedia(true);
    try {
      const uploadRes = await api.uploadChatMedia(file, accessToken);
      socketRef.current?.emit('send_message', {
        conversationId: activeId,
        text: draft.trim(),
        mediaUrl: uploadRes.mediaUrl,
        mediaType: uploadRes.mediaType,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
      });
      setDraft('');
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Upload failed: ' + (err.message || 'Please check file format and size'));
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ── Reaction Handler ─────────────────────────────────────────────────
  const handleReact = (messageId, emoji, e) => {
    e?.stopPropagation();
    socketRef.current?.emit('react_message', { conversationId: activeId, messageId, emoji });
    setReactionPickerMessageId(null);
    setActiveMenuMessageId(null);
  };

  // ── Edit Handler ─────────────────────────────────────────────────────
  const startEdit = (msg, e) => {
    e?.stopPropagation();
    const createdTime = new Date(msg.createdAt).getTime();
    const elapsedMinutes = (Date.now() - createdTime) / 60000;
    if (elapsedMinutes > 15) {
      alert('Messages can only be edited within 15 minutes of sending.');
      return;
    }
    setEditingMessage({ id: msg._id, text: msg.text });
    setDraft(msg.text);
    setActiveMenuMessageId(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setDraft('');
  };

  const submitEdit = () => {
    if (!editingMessage || !draft.trim()) return;
    socketRef.current?.emit(
      'edit_message',
      { conversationId: activeId, messageId: editingMessage.id, text: draft.trim() },
      (res) => {
        if (res?.error) alert(res.error);
      }
    );
    setEditingMessage(null);
    setDraft('');
  };

  // ── Delete for me Handler ────────────────────────────────────────────
  const handleDeleteForMe = (messageId, e) => {
    e?.stopPropagation();
    socketRef.current?.emit('delete_for_me', { conversationId: activeId, messageId });
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
    setActiveMenuMessageId(null);
  };

  // Mobile back button
  const backToList = () => {
    setActiveId(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex-1 flex min-h-full rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      {/* ── Hidden File Inputs ───────────────────────────────────────── */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        onChange={(e) => handleFileUpload(e, 'file')}
        className="hidden"
      />

      {/* ── Conversation list ─────────────────────────────────────────── */}
      <div className={`w-full sm:w-80 md:w-96 shrink-0 border-r border-border/70 flex flex-col bg-card/60 ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-5 py-4 border-b border-border/70 bg-card">
          <h2 className="font-extrabold text-lg text-foreground tracking-tight">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-4 text-muted-foreground">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No active conversations.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Connect with borrowers or lenders from the Marketplace.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {conversations.map((c) => {
                const other = c.otherParticipant;
                const isOnline = presence[other._id]?.online ?? false;
                const isSelected = activeId === c.conversationId;
                return (
                  <button
                    key={c.conversationId}
                    onClick={() => openConversation(c.conversationId)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10 border-l-4 border-primary pl-3' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 border border-border">
                        <AvatarImage src={other.avatarUrl} className="object-cover" />
                        <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                          {other.fullName?.[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{other.fullName || 'User'}</span>
                        {c.lastMessageAt && (
                          <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                            {formatConversationListTime(c.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {c.lastMessagePreview || 'Say hello 👋'}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5 shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Thread ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-background/50 ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">MT Pocket Peer Messaging</h3>
            <p className="text-xs max-w-sm">Select a conversation on the left to negotiate terms, share verified details, or message your lending partner.</p>
          </div>
        ) : (
          <>
            {/* WhatsApp Styled Thread Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70 bg-card z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={backToList}
                  className="sm:hidden p-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={activeConversation.otherParticipant.avatarUrl} className="object-cover" />
                    <AvatarFallback className="font-bold bg-primary/10 text-primary">
                      {activeConversation.otherParticipant.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {presence[activeConversation.otherParticipant._id]?.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {activeConversation.otherParticipant.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {otherTyping ? (
                      <span className="text-primary font-semibold animate-pulse">typing…</span>
                    ) : presence[activeConversation.otherParticipant._id]?.online ? (
                      <span className="text-emerald-600 font-semibold">online</span>
                    ) : (
                      formatLastSeenWhatsApp(
                        presence[activeConversation.otherParticipant._id]?.lastActiveAt
                          ?? activeConversation.otherParticipant.lastActiveAt,
                      )
                    )}
                  </p>
                </div>
              </div>

              {activeConversation.loanRequest && (
                <div className="hidden md:flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl text-xs text-muted-foreground border border-border/50">
                  <span>Loan Match:</span>
                  <span className="font-bold text-foreground">₹{activeConversation.loanRequest.amount?.toLocaleString()}</span>
                  <span className="capitalize px-1.5 py-0.2 bg-primary/10 text-primary rounded-md text-[10px] font-bold">
                    {activeConversation.loanRequest.category}
                  </span>
                </div>
              )}
            </div>

            {/* Messages Thread Container */}
            <ScrollArea className="flex-1 px-3 sm:px-6 py-4" ref={scrollRef}>
              {hasMore && messages.length > 0 && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="text-xs rounded-full px-4 h-8 bg-card shadow-xs cursor-pointer"
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
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((m, idx) => {
                    const isMine = m.senderId === user?.id;
                    const canEdit = isMine && (Date.now() - new Date(m.createdAt).getTime()) <= 15 * 60 * 1000;

                    // Day Divider Logic
                    const prevMsg = messages[idx - 1];
                    const currentDay = formatChatDay(m.createdAt);
                    const prevDay = prevMsg ? formatChatDay(prevMsg.createdAt) : null;
                    const showDayDivider = currentDay !== prevDay;

                    return (
                      <div key={m._id} className="flex flex-col">
                        {/* WhatsApp-Style Centered Day Chip */}
                        {showDayDivider && (
                          <div className="flex justify-center my-3">
                            <span className="bg-card/90 text-muted-foreground border border-border/70 text-[11px] font-bold px-3 py-1 rounded-lg shadow-2xs uppercase tracking-wider">
                              {currentDay}
                            </span>
                          </div>
                        )}

                        <div className={`group relative flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {/* Hover action menu trigger */}
                          <div className={`relative opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isMine ? 'order-first' : 'order-last'}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionPickerMessageId(reactionPickerMessageId === m._id ? null : m._id);
                                setActiveMenuMessageId(null);
                              }}
                              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                              title="React"
                            >
                              <Smile size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMessageId(activeMenuMessageId === m._id ? null : m._id);
                                setReactionPickerMessageId(null);
                              }}
                              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Emoji Reaction Quick Bar */}
                            <AnimatePresence>
                              {reactionPickerMessageId === m._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute bottom-full mb-1 z-30 bg-card border border-border rounded-full shadow-lg p-1 flex items-center gap-1"
                                >
                                  {COMMON_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={(e) => handleReact(m._id, emoji, e)}
                                      className="p-1.5 hover:scale-125 transition-transform text-base cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Dropdown Options */}
                            <AnimatePresence>
                              {activeMenuMessageId === m._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className={`absolute bottom-full mb-1 z-30 w-36 rounded-xl border border-border bg-card shadow-xl p-1 text-xs ${
                                    isMine ? 'right-0' : 'left-0'
                                  }`}
                                >
                                  {canEdit && (
                                    <button
                                      onClick={(e) => startEdit(m, e)}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted font-medium transition-colors cursor-pointer"
                                    >
                                      <Edit2 size={13} />
                                      <span>Edit (15m)</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteForMe(m._id, e)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-medium transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete for me</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Message Bubble Container */}
                          <div
                            className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs ${
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-xs'
                                : 'bg-card text-foreground rounded-bl-xs border border-border/60'
                            }`}
                          >
                            {/* Attached Photo */}
                            {m.mediaUrl && m.mediaType === 'image' && (
                              <div className="mb-2 overflow-hidden rounded-xl bg-black/10">
                                <img
                                  src={m.mediaUrl}
                                  alt="Attachment"
                                  onClick={() => setPreviewImage(m.mediaUrl)}
                                  className="max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                />
                              </div>
                            )}

                            {/* Attached Document/File */}
                            {m.mediaUrl && m.mediaType === 'file' && (
                              <a
                                href={m.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${
                                  isMine
                                    ? 'bg-primary-foreground/15 hover:bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-muted/70 hover:bg-muted text-foreground'
                                }`}
                              >
                                <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
                                  <FileText size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-xs truncate">{m.fileName || 'Document File'}</p>
                                  {m.fileSize && (
                                    <p className="text-[10px] opacity-75">{formatFileSize(m.fileSize)}</p>
                                  )}
                                </div>
                                <Download size={16} className="shrink-0 opacity-70" />
                              </a>
                            )}

                            {/* Text Content */}
                            {m.text && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                            )}

                            {/* Timestamp + Status + Edited Tag */}
                            <div
                              className={`flex items-center gap-1.5 mt-1.5 justify-end text-[10px] ${
                                isMine ? 'text-primary-foreground/75' : 'text-muted-foreground'
                              }`}
                            >
                              {m.isEdited && (
                                <span className="italic opacity-80">(edited)</span>
                              )}
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                              {isMine && (
                                m.status === 'read' ? (
                                  <CheckCheck size={14} className="text-sky-300" />
                                ) : m.status === 'delivered' ? (
                                  <CheckCheck size={14} />
                                ) : (
                                  <Check size={14} />
                                )
                              )}
                            </div>

                            {/* Reactions display pill under bubble */}
                            {m.reactions && m.reactions.length > 0 && (
                              <div
                                className={`absolute -bottom-3 flex items-center gap-1 bg-card border border-border/80 px-2 py-0.5 rounded-full shadow-xs text-xs ${
                                  isMine ? 'right-2' : 'left-2'
                                }`}
                              >
                                {Array.from(new Set(m.reactions.map((r) => r.emoji))).map((emoji) => (
                                  <span key={emoji}>{emoji}</span>
                                ))}
                                {m.reactions.length > 1 && (
                                  <span className="text-[10px] font-bold text-muted-foreground">{m.reactions.length}</span>
                                )}
                              </div>
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

            {/* Editing banner */}
            {editingMessage && (
              <div className="flex items-center justify-between px-5 py-2.5 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-2 truncate">
                  <Edit2 size={14} />
                  <span>Editing message (only within 15 mins): <strong>"{editingMessage.text}"</strong></span>
                </div>
                <button
                  onClick={cancelEdit}
                  className="p-1 hover:bg-amber-500/20 rounded-md transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* WhatsApp Styled Bottom Composer */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/70 bg-card">
              {/* Media Attachment buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={uploadingMedia}
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                  title="Send Photo"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  disabled={uploadingMedia}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                  title="Send Document"
                >
                  <Paperclip size={20} />
                </button>
              </div>

              <div className="flex-1 relative">
                <Input
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={editingMessage ? 'Edit your message…' : 'Type a message…'}
                  className="w-full rounded-xl bg-background border-border/80 text-sm py-5 px-4 focus:ring-primary"
                />
              </div>

              <Button
                onClick={send}
                disabled={(!draft.trim() && !uploadingMedia) || sending}
                size="icon"
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shrink-0 shadow-xs"
              >
                {sending || uploadingMedia ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <img src={previewImage} alt="Enlarged preview" className="max-h-[85vh] w-auto object-contain rounded-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}