/* =========================================================
   MORTGAGES ARE US — chat.js
   AI chat interface: name gate, message threading,
   SSE streaming from /api/public/chat
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  let visitorName  = '';
  let chatHistory  = [];    // [{role:'user'|'assistant', content:'...'}]
  let isStreaming  = false;

  /* -------------------------------------------------------
     Elements
  ------------------------------------------------------- */
  const gateEl       = document.getElementById('chat-gate');
  const interfaceEl  = document.getElementById('chat-interface');
  const nameInput    = document.getElementById('visitor-name');
  const startBtn     = document.getElementById('start-chat-btn');
  const messagesEl   = document.getElementById('chat-messages');
  const chatInput    = document.getElementById('chat-input');
  const sendBtn      = document.getElementById('chat-send-btn');

  if (!gateEl || !interfaceEl) return; // Not on chat page

  /* -------------------------------------------------------
     1. NAME GATE
  ------------------------------------------------------- */
  function startChat() {
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      nameInput && nameInput.focus();
      return;
    }
    visitorName = name;

    // Hide gate, show chat
    gateEl.hidden      = true;
    interfaceEl.hidden = false;

    // Post opening message from adviser
    const opening = `Hi ${escapeHtml(visitorName)}, I'm the MAU Adviser. I specialise in adverse credit mortgages and can answer questions about CCJs, defaults, IVAs, and getting a mortgage with any credit history. What would you like to know today?`;
    appendMessage('assistant', opening);
    chatHistory.push({ role: 'assistant', content: opening });

    chatInput && chatInput.focus();
  }

  if (startBtn) {
    startBtn.addEventListener('click', startChat);
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startChat();
    });
  }

  /* -------------------------------------------------------
     2. SEND MESSAGE
  ------------------------------------------------------- */
  function sendMessage() {
    if (isStreaming) return;

    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    autoResizeTextarea(chatInput);

    // Add user message to UI and history
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    setSendDisabled(true);

    // Show typing indicator
    const typingId = appendTypingIndicator();

    isStreaming = true;

    // POST to /api/public/chat — expects SSE stream
    fetch('/api/public/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:     visitorName,
        messages: chatHistory,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Server error: ' + res.status);

      removeTypingIndicator(typingId);

      const assistantBubbleId = 'msg-' + Date.now();
      appendMessage('assistant', '', assistantBubbleId);
      let accumulatedText = '';

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      async function readStream() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') break;
            if (!payload) continue;

            try {
              const parsed = JSON.parse(payload);
              const token  = parsed.content || parsed.delta || parsed.text || '';
              if (token) {
                accumulatedText += token;
                updateMessageBubble(assistantBubbleId, accumulatedText);
                scrollToBottom();
              }
            } catch {
              // Plain text fallback (non-JSON SSE)
              accumulatedText += payload;
              updateMessageBubble(assistantBubbleId, accumulatedText);
              scrollToBottom();
            }
          }
        }
      }

      await readStream();

      // Save full assistant response to history
      if (accumulatedText) {
        chatHistory.push({ role: 'assistant', content: accumulatedText });
      } else {
        // If stream returned nothing visible, show a fallback
        const fallback = "I'm sorry, I wasn't able to respond right now. Please try again or call us on 0203 411 1009.";
        updateMessageBubble(assistantBubbleId, fallback);
        chatHistory.push({ role: 'assistant', content: fallback });
      }

    }).catch((err) => {
      removeTypingIndicator(typingId);
      const errMsg = "Sorry, something went wrong. Please try again or call us on 0203 411 1009.";
      appendMessage('assistant', errMsg);
      chatHistory.push({ role: 'assistant', content: errMsg });
      console.error('[chat.js] Stream error:', err);
    }).finally(() => {
      isStreaming = false;
      setSendDisabled(false);
      chatInput && chatInput.focus();
    });
  }

  /* -------------------------------------------------------
     3. EVENT LISTENERS
  ------------------------------------------------------- */
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    chatInput.addEventListener('input', () => autoResizeTextarea(chatInput));
  }

  /* -------------------------------------------------------
     4. DOM HELPERS
  ------------------------------------------------------- */
  function appendMessage(role, content, id) {
    if (!messagesEl) return;

    const msgEl = document.createElement('div');
    msgEl.classList.add('chat-message', 'chat-message--' + role);
    if (id) msgEl.id = id;

    const avatarEl   = document.createElement('div');
    avatarEl.classList.add('message-avatar', 'message-avatar--' + role);
    avatarEl.setAttribute('aria-hidden', 'true');
    avatarEl.textContent = role === 'assistant' ? 'MA' : getInitials(visitorName);

    const bubbleEl = document.createElement('div');
    bubbleEl.classList.add('message-bubble');
    bubbleEl.innerHTML = formatMessage(content);

    msgEl.appendChild(avatarEl);
    msgEl.appendChild(bubbleEl);
    messagesEl.appendChild(msgEl);

    scrollToBottom();
    return msgEl;
  }

  function updateMessageBubble(id, content) {
    const msgEl = document.getElementById(id);
    if (!msgEl) return;
    const bubble = msgEl.querySelector('.message-bubble');
    if (bubble) bubble.innerHTML = formatMessage(content);
  }

  function appendTypingIndicator() {
    if (!messagesEl) return null;
    const id    = 'typing-' + Date.now();
    const msgEl = document.createElement('div');
    msgEl.classList.add('chat-message', 'chat-message--assistant');
    msgEl.id = id;

    const avatarEl = document.createElement('div');
    avatarEl.classList.add('message-avatar', 'message-avatar--assistant');
    avatarEl.setAttribute('aria-hidden', 'true');
    avatarEl.textContent = 'MA';

    const bubbleEl = document.createElement('div');
    bubbleEl.classList.add('message-bubble');
    bubbleEl.innerHTML = '<div class="typing-dots" aria-label="Adviser is typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';

    msgEl.appendChild(avatarEl);
    msgEl.appendChild(bubbleEl);
    messagesEl.appendChild(msgEl);
    scrollToBottom();
    return id;
  }

  function removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    if (!messagesEl) return;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setSendDisabled(disabled) {
    if (sendBtn)    sendBtn.disabled    = disabled;
    if (chatInput)  chatInput.disabled  = disabled;
  }

  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  /* -------------------------------------------------------
     5. TEXT HELPERS
  ------------------------------------------------------- */
  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatMessage(text) {
    if (!text) return '';
    // Convert line breaks, bold **text**, and links
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

})();
