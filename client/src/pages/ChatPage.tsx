import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import {
  confirmReturnApi,
  listConversationsApi,
  listMessagesApi,
  sendMessageApi
} from "../services/api/messageApi";
import { listMatchesApi } from "../services/api/miscApi";
import { Conversation, MatchItem, Message } from "../types";
import { usePolling } from "../hooks/usePolling";
import { useAuthStore } from "../store/authStore";
import { resolveMediaUrl } from "../utils/media";

function formatRelativeChatTime(value?: string | null): string {
  if (!value) {
    return "just now";
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "just now";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }

  const createdAt = new Date(timestamp);
  const now = new Date();
  const isToday = createdAt.toDateString() === now.toDateString();
  if (isToday) {
    return createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return createdAt.toLocaleDateString();
}

export function ChatPage() {
  const [params] = useSearchParams();
  const postIdParam = params.get("postId");
  const receiverIdParam = params.get("receiverId");
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [text, setText] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const hasDirectContext = Boolean(postIdParam && receiverIdParam);
  const canSendInCurrentContext = Boolean(selectedConversationId || hasDirectContext);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const activeConversationName = useMemo(() => {
    if (!selectedConversation) {
      return "New conversation";
    }

    if (!currentUserId) {
      return selectedConversation.user_one_name ?? selectedConversation.user_two_name ?? "Conversation";
    }

    return selectedConversation.user_one_id === currentUserId
      ? selectedConversation.user_two_name ?? "Conversation"
      : selectedConversation.user_one_name ?? "Conversation";
  }, [selectedConversation, currentUserId]);

  const conversationMatches = useMemo(() => {
    if (!selectedConversation) {
      return [];
    }

    return matches.filter(
      (match) =>
        match.lostPostId === selectedConversation.post_id ||
        match.foundPostId === selectedConversation.post_id
    );
  }, [selectedConversation, matches]);

  const returnedMatch = useMemo(
    () => conversationMatches.find((match) => match.status === "returned") ?? null,
    [conversationMatches]
  );

  const confirmableMatch = useMemo(() => {
    const accepted = conversationMatches.find((match) => match.status === "accepted");
    if (accepted) {
      return accepted;
    }

    return conversationMatches.find((match) => match.status === "suggested") ?? null;
  }, [conversationMatches]);

  const returnStatusText = useMemo(() => {
    if (!selectedConversationId) {
      return "Select a conversation first.";
    }

    if (returnedMatch) {
      return `Already returned with Match #${returnedMatch.id}.`;
    }

    if (confirmableMatch) {
      return `Ready to confirm using Match #${confirmableMatch.id}.`;
    }

    return "No active match found for this conversation.";
  }, [selectedConversationId, returnedMatch, confirmableMatch]);

  async function loadConversations() {
    const rows = await listConversationsApi();
    setConversations(rows);
    setSelectedConversationId((current) => {
      if (current && rows.some((conversation) => conversation.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
  }

  async function loadMatches() {
    const rows = await listMatchesApi();
    setMatches(rows);
  }

  async function loadMessages() {
    if (!selectedConversationId) {
      return;
    }
    const data = await listMessagesApi(selectedConversationId);
    setMessages(data.messages);
  }

  useEffect(() => {
    void loadConversations();
    void loadMatches();
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, selectedConversationId]);

  usePolling(async () => {
    await Promise.all([loadMessages(), loadMatches()]);
  }, 5000, Boolean(selectedConversationId));

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function clearSelectedAttachment() {
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    setSelectedImageFile(file);
    setSelectedImagePreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(file);
    });
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();

    if (sendingMessage) {
      return;
    }

    const trimmedText = text.trim();

    const payload: {
      conversationId?: number;
      postId?: number;
      receiverId?: number;
      text?: string;
      imageFile?: File;
    } = {
      text: trimmedText || undefined,
      imageFile: selectedImageFile ?? undefined
    };

    if (!payload.text && !payload.imageFile) {
      return;
    }

    if (!canSendInCurrentContext) {
      alert("Select a conversation first, or open chat from a post detail page.");
      return;
    }

    if (selectedConversationId) {
      payload.conversationId = selectedConversationId;
    } else if (postIdParam && receiverIdParam) {
      payload.postId = Number(postIdParam);
      payload.receiverId = Number(receiverIdParam);
    }

    setSendingMessage(true);
    try {
      const result = await sendMessageApi(payload);
      setSelectedConversationId(result.conversationId);
      setText("");
      clearSelectedAttachment();
      await loadConversations();
      await loadMessages();
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleConfirmReturn() {
    if (
      confirmingReturn ||
      !selectedConversationId ||
      !confirmableMatch ||
      Boolean(returnedMatch)
    ) {
      return;
    }

    setConfirmingReturn(true);
    try {
      await confirmReturnApi(selectedConversationId, confirmableMatch.id);
      await loadMatches();
      alert("Return confirmed and statuses updated.");
    } finally {
      setConfirmingReturn(false);
    }
  }

  return (
    <AppShell title="Chat">
      <section className="chat-layout messenger-layout">
        <aside className="panel chat-list messenger-list">
          <div className="chat-list-head">
            <h3>Messages</h3>
            <p className="hint-text">Chat like a texting app with real-time polling refresh.</p>
          </div>

          <div className="chat-list-scroll">
            {conversations.length === 0 && <p>No conversations yet. Start from a post detail page.</p>}
            {conversations.map((conversation) => {
              const conversationName =
                currentUserId && conversation.user_one_id === currentUserId
                  ? conversation.user_two_name
                  : conversation.user_one_name;

              return (
                <button
                  key={conversation.id}
                  className={`chat-list-item ${selectedConversationId === conversation.id ? "active" : ""}`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <strong>{conversationName ?? "Conversation"}</strong>
                  <small>{conversation.post_title}</small>
                  <small>{formatRelativeChatTime(conversation.last_message_at ?? conversation.created_at)}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="panel chat-main messenger-main">
          <header className="chat-main-header">
            <div>
              <h3 className="chat-partner-name">{activeConversationName}</h3>
              <p className="hint-text">{selectedConversation?.post_title ?? "Pick a conversation to start chatting."}</p>
            </div>

            <div className="chat-header-actions">
              <p className="hint-text">Phone numbers are disclosed only in authorized chat context by policy.</p>

              <div className="chat-return-box">
                <small>Return Workflow</small>
                <button
                  className="secondary-btn chat-return-btn"
                  type="button"
                  onClick={() => void handleConfirmReturn()}
                  disabled={
                    confirmingReturn ||
                    !selectedConversationId ||
                    !confirmableMatch ||
                    Boolean(returnedMatch)
                  }
                >
                  {confirmingReturn
                    ? "Confirming..."
                    : returnedMatch
                      ? "Already Returned"
                      : confirmableMatch
                        ? "Confirm Item Returned"
                        : "No Match To Confirm"}
                </button>
                <p className="hint-text">{returnStatusText}</p>
              </div>
            </div>
          </header>

          <div className="message-thread messenger-thread" ref={threadRef}>
            {messages.length === 0 && (
              <p className="chat-thread-empty">No messages yet. Send the first one.</p>
            )}

            {messages.map((message) => {
              const mine = message.sender_id === currentUserId;
              const mediaUrl = resolveMediaUrl(message.image_url);

              return (
                <article key={message.id} className={`message-row ${mine ? "mine" : "other"}`}>
                  <div className={`message-bubble ${mine ? "mine" : "other"}`}>
                    {!mine && message.sender_name && <p className="bubble-author">{message.sender_name}</p>}

                    {message.text && <p>{message.text}</p>}

                    {mediaUrl && (
                      <a href={mediaUrl} target="_blank" rel="noreferrer" className="message-image-link">
                        <img
                          src={mediaUrl}
                          alt="Message attachment"
                          className="message-image"
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    )}

                    <small>{formatRelativeChatTime(message.created_at)}</small>
                  </div>
                </article>
              );
            })}
          </div>

          <form className="chat-composer" onSubmit={handleSend}>
            <textarea
              placeholder="Write a message..."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />

            {selectedImagePreviewUrl && (
              <div className="chat-composer-attachment">
                <img src={selectedImagePreviewUrl} alt="Attachment preview" className="chat-attachment-preview" />
                <div className="chat-attachment-meta">
                  <span>{selectedImageFile?.name ?? "Attached image"}</span>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={clearSelectedAttachment}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="chat-composer-row">
              <label className="secondary-btn chat-attach-btn">
                Attach Image
                <input type="file" accept="image/*" onChange={handleAttachmentChange} />
              </label>

              <button
                className="primary-btn"
                type="submit"
                disabled={sendingMessage || !canSendInCurrentContext}
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>

            {!canSendInCurrentContext && (
              <p className="hint-text">Select an existing conversation to send messages.</p>
            )}
          </form>
        </div>
      </section>
    </AppShell>
  );
}
