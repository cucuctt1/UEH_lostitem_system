import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import {
  confirmReturnApi,
  listConversationsApi,
  listMessagesApi,
  sendMessageApi
} from "../services/api/messageApi";
import { createConversationApi, requestVerificationApi } from "../services/api/messageApi";
import { listMatchesApi, verifyMatchApi } from "../services/api/miscApi";
import { Conversation, MatchItem, Message } from "../types";
import { usePolling } from "../hooks/usePolling";
import { useAuthStore } from "../store/authStore";
import { resolveMediaUrl } from "../utils/media";

function formatRelativeChatTime(value?: string | null): string {
  if (!value) {
    return "vừa xong";
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "vừa xong";
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} giây trước`;
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} phút trước`;
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
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const postIdParam = params.get("postId");
  const receiverIdParam = params.get("receiverId");
  const conversationIdParam = params.get("conversationId");
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
  const [verifyingMatch, setVerifyingMatch] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const hasDirectContext = Boolean(postIdParam && receiverIdParam);
  const requestedConversationId = conversationIdParam ? Number(conversationIdParam) : null;
  const canSendInCurrentContext = Boolean(selectedConversationId || hasDirectContext);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const activeConversationPartner = useMemo(() => {
    if (!selectedConversation) {
      return "Chọn một cuộc trò chuyện";
    }

    if (!currentUserId) {
      return selectedConversation.user_one_name ?? selectedConversation.user_two_name ?? "Cuộc trò chuyện";
    }

    return selectedConversation.user_one_id === currentUserId
      ? selectedConversation.user_two_name ?? "Cuộc trò chuyện"
      : selectedConversation.user_one_name ?? "Cuộc trò chuyện";
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

  const suggestedMatch = useMemo(
    () => conversationMatches.find((match) => match.status === "suggested") ?? null,
    [conversationMatches]
  );

  const rejectedMatch = useMemo(
    () => conversationMatches.find((match) => match.status === "rejected") ?? null,
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
      return "Hãy chọn cuộc trò chuyện trước.";
    }

    if (returnedMatch) {
      return `Đã xác nhận trả lại với Match #${returnedMatch.id}.`;
    }

    if (rejectedMatch) {
      return `Match #${rejectedMatch.id} đã bị từ chối. Hãy chờ gợi ý khác.`;
    }

    if (confirmableMatch) {
      return `Sẵn sàng xác nhận bằng Match #${confirmableMatch.id}.`;
    }

    return "Không tìm thấy match đang hoạt động cho cuộc trò chuyện này.";
  }, [selectedConversationId, returnedMatch, rejectedMatch, confirmableMatch]);

  const canPosterVerifySuggestedMatch = Boolean(
    selectedConversation &&
      selectedConversation.post_owner_id === currentUserId &&
      suggestedMatch &&
      !returnedMatch
  );

  async function loadConversations() {
    const rows = await listConversationsApi();
    setConversations(rows);
    setSelectedConversationId((current) => {
      if (requestedConversationId && rows.some((conversation) => conversation.id === requestedConversationId)) {
        return requestedConversationId;
      }

      if (current && rows.some((conversation) => conversation.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
  }

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    if (conversations.some((conversation) => conversation.id === requestedConversationId)) {
      setSelectedConversationId(requestedConversationId);
    }
  }, [requestedConversationId, conversations]);

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
    // If opened from a post detail with postId & receiverId, ensure a conversation exists and select it
    if (hasDirectContext && postIdParam && receiverIdParam) {
      const postId = Number(postIdParam);
      const receiverId = Number(receiverIdParam);
      void (async () => {
        try {
          const { conversationId } = await createConversationApi(postId, receiverId);
          setSelectedConversationId(conversationId);
          await loadConversations();
          await loadMessages();
        } catch (e) {
          // ignore
        }
      })();
    }
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
      alert("Vui lòng chọn tệp hình ảnh.");
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
      alert("Hãy chọn cuộc trò chuyện hoặc mở chat từ trang chi tiết bài đăng.");
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
      alert("Đã xác nhận trả lại và cập nhật trạng thái.");
    } finally {
      setConfirmingReturn(false);
    }
  }

  async function handleManualVerify(status: "accepted" | "rejected") {
    if (!canPosterVerifySuggestedMatch || !suggestedMatch || verifyingMatch) {
      return;
    }

    setVerifyingMatch(true);
    try {
      await verifyMatchApi(suggestedMatch.id, status);
      await loadMatches();
      alert(status === "accepted" ? "Đã xác minh match thành công." : "Đã từ chối match.");
    } finally {
      setVerifyingMatch(false);
    }
  }

  async function handleRequestVerification() {
    if (!selectedConversationId || !selectedConversation || selectedConversation.post_owner_id !== currentUserId) {
      return;
    }

    try {
      await requestVerificationApi(selectedConversationId, selectedImageFile ?? undefined);
      await loadMessages();
      await loadMatches();
      clearSelectedAttachment();
      alert("Đã gửi yêu cầu xác minh. Admin đã được thông báo.");
    } catch (err) {
      alert("Không thể gửi yêu cầu xác minh.");
    }
  }

  return (
    <AppShell title="Tin nhắn">
      <section className="chat-layout messenger-layout">
        <aside className="panel chat-list messenger-list">
          <div className="chat-list-head">
            <h3>Tin nhắn</h3>
            <p className="hint-text">Cập nhật tự động theo chu kỳ để không bỏ lỡ hội thoại mới.</p>
          </div>

          <div className="chat-list-scroll">
            {conversations.length === 0 && <p>Chưa có cuộc trò chuyện nào. Hãy bắt đầu từ trang chi tiết bài đăng.</p>}
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
                  <strong>{conversationName ?? "Cuộc trò chuyện"}</strong>
                  <small>Về bài: {conversation.post_title}</small>
                  <small>{formatRelativeChatTime(conversation.last_message_at ?? conversation.created_at)}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="panel chat-main messenger-main">
          <header className="chat-main-header">
            <div>
              <p className="auth-kicker">Đang trò chuyện với</p>
              <h3 className="chat-partner-name">{activeConversationPartner}</h3>
              <p className="hint-text">{selectedConversation?.post_title ?? "Chọn cuộc trò chuyện để bắt đầu nhắn tin."}</p>
              {selectedConversation && (
                <button className="ghost-btn" type="button" onClick={() => navigate(`/posts/${selectedConversation.post_id}`)}>
                  Mở bài đăng liên quan
                </button>
              )}
            </div>

            <div className="chat-header-actions">
              <p className="hint-text">Số điện thoại chỉ hiển thị trong ngữ cảnh chat hợp lệ theo chính sách.</p>

              <div className="chat-return-box">
                <small>Quy trình xác nhận trả lại</small>

                {canPosterVerifySuggestedMatch && (
                  <div className="button-group">
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => void handleManualVerify("accepted")}
                      disabled={verifyingMatch}
                    >
                      {verifyingMatch ? "Đang xử lý..." : "Xác minh khớp"}
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => void handleManualVerify("rejected")}
                      disabled={verifyingMatch}
                    >
                      Từ chối khớp
                    </button>
                  </div>
                )}

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
                    ? "Đang xác nhận..."
                    : returnedMatch
                      ? "Đã trả lại"
                      : confirmableMatch
                        ? "Xác nhận đã trả lại"
                        : "Không có match để xác nhận"}
                </button>
                <p className="hint-text">{returnStatusText}</p>
              </div>
            </div>
          </header>

          <div className="message-thread messenger-thread" ref={threadRef}>
            {messages.length === 0 && (
              <p className="chat-thread-empty">Chưa có tin nhắn. Hãy gửi tin đầu tiên.</p>
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
                          alt="Tệp đính kèm"
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
              placeholder="Nhập nội dung tin nhắn..."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />

            {selectedImagePreviewUrl && (
              <div className="chat-composer-attachment">
                <img src={selectedImagePreviewUrl} alt="Xem trước tệp đính kèm" className="chat-attachment-preview" />
                <div className="chat-attachment-meta">
                  <span>{selectedImageFile?.name ?? "Ảnh đính kèm"}</span>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={clearSelectedAttachment}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}

            <div className="chat-composer-row">
              <label className="secondary-btn chat-attach-btn">
                Đính kèm ảnh
                <input type="file" accept="image/*" onChange={handleAttachmentChange} />
              </label>

                {selectedConversation && selectedConversation.post_owner_id === currentUserId && (
                  <button className="ghost-btn" type="button" onClick={() => void handleRequestVerification()}>
                  Yêu cầu xác minh
                </button>
              )}

              <button
                className="primary-btn"
                type="submit"
                disabled={sendingMessage || !canSendInCurrentContext}
              >
                {sendingMessage ? "Đang gửi..." : "Gửi"}
              </button>
            </div>

            {!canSendInCurrentContext && (
              <p className="hint-text">Hãy chọn cuộc trò chuyện hiện có để gửi tin nhắn.</p>
            )}
          </form>
        </div>
      </section>
    </AppShell>
  );
}
