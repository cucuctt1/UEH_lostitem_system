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
    return "vua xong";
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "vua xong";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} giay truoc`;
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} phut truoc`;
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
      return "Cuoc tro chuyen moi";
    }

    if (!currentUserId) {
      return selectedConversation.user_one_name ?? selectedConversation.user_two_name ?? "Cuoc tro chuyen";
    }

    return selectedConversation.user_one_id === currentUserId
      ? selectedConversation.user_two_name ?? "Cuoc tro chuyen"
      : selectedConversation.user_one_name ?? "Cuoc tro chuyen";
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
      return "Hay chon cuoc tro chuyen truoc.";
    }

    if (returnedMatch) {
      return `Da xac nhan tra lai voi Match #${returnedMatch.id}.`;
    }

    if (confirmableMatch) {
      return `San sang xac nhan bang Match #${confirmableMatch.id}.`;
    }

    return "Khong tim thay match dang hoat dong cho cuoc tro chuyen nay.";
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
      alert("Vui long chon tep hinh anh.");
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
      alert("Hay chon cuoc tro chuyen hoac mo chat tu trang chi tiet bai dang.");
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
      alert("Da xac nhan tra lai va cap nhat trang thai.");
    } finally {
      setConfirmingReturn(false);
    }
  }

  return (
    <AppShell title="Tin nhan">
      <section className="chat-layout messenger-layout">
        <aside className="panel chat-list messenger-list">
          <div className="chat-list-head">
            <h3>Tin nhan</h3>
            <p className="hint-text">Cap nhat tu dong theo chu ky de khong bo lo hoi thoai moi.</p>
          </div>

          <div className="chat-list-scroll">
            {conversations.length === 0 && <p>Chua co cuoc tro chuyen nao. Hay bat dau tu trang chi tiet bai dang.</p>}
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
                  <strong>{conversationName ?? "Cuoc tro chuyen"}</strong>
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
              <p className="hint-text">{selectedConversation?.post_title ?? "Chon cuoc tro chuyen de bat dau nhan tin."}</p>
            </div>

            <div className="chat-header-actions">
              <p className="hint-text">So dien thoai chi hien thi trong ngu canh chat hop le theo chinh sach.</p>

              <div className="chat-return-box">
                <small>Quy trinh xac nhan tra lai</small>
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
                    ? "Dang xac nhan..."
                    : returnedMatch
                      ? "Da tra lai"
                      : confirmableMatch
                        ? "Xac nhan da tra lai"
                        : "Khong co match de xac nhan"}
                </button>
                <p className="hint-text">{returnStatusText}</p>
              </div>
            </div>
          </header>

          <div className="message-thread messenger-thread" ref={threadRef}>
            {messages.length === 0 && (
              <p className="chat-thread-empty">Chua co tin nhan. Hay gui tin dau tien.</p>
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
                          alt="Tep dinh kem"
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
              placeholder="Nhap noi dung tin nhan..."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />

            {selectedImagePreviewUrl && (
              <div className="chat-composer-attachment">
                <img src={selectedImagePreviewUrl} alt="Xem truoc tep dinh kem" className="chat-attachment-preview" />
                <div className="chat-attachment-meta">
                  <span>{selectedImageFile?.name ?? "Anh dinh kem"}</span>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={clearSelectedAttachment}
                  >
                    Xoa
                  </button>
                </div>
              </div>
            )}

            <div className="chat-composer-row">
              <label className="secondary-btn chat-attach-btn">
                Dinh kem anh
                <input type="file" accept="image/*" onChange={handleAttachmentChange} />
              </label>

              <button
                className="primary-btn"
                type="submit"
                disabled={sendingMessage || !canSendInCurrentContext}
              >
                {sendingMessage ? "Dang gui..." : "Gui"}
              </button>
            </div>

            {!canSendInCurrentContext && (
              <p className="hint-text">Hay chon cuoc tro chuyen hien co de gui tin nhan.</p>
            )}
          </form>
        </div>
      </section>
    </AppShell>
  );
}
