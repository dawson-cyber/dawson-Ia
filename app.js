const API_URL = "https://api.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";
const SYSTEM_PROMPT = `Tu es Dawson-ia, un assistant IA expert en programmation. Tu réponds exclusivement aux questions liées au code, aux langages de programmation, aux algorithmes, aux frameworks, aux bases de données, au débogage, et aux bonnes pratiques de développement.

Règles :
- Réponds toujours en français sauf si on te parle dans une autre langue
- Quand tu montres du code, utilise des blocs \`\`\`langage ... \`\`\`
- Sois concis, précis et pédagogique
- Si la question n'est pas liée à la programmation, redirige poliment vers ce sujet
- Donne des exemples concrets et pratiques`;

let isLoading = false;
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendSuggestion(text) {
  inputEl.value = text;
  sendMessage();
}

function removeWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();
}

function appendMessage(role, content) {
  removeWelcome();
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const label = document.createElement('div');
  label.className = 'msg-label';
  label.textContent = role === 'user' ? '👤 Vous' : '⚡ CodeMind';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatMessage(content);

  div.appendChild(label);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function formatMessage(text) {
  // Handle code blocks
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const langLabel = lang ? `<span class="lang-tag">// ${lang}</span>` : '';
    return `<pre>${langLabel}<code>${escapeHtml(code.trim())}</code><button class="copy-btn" onclick="copyCode(this)">Copier</button></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Line breaks to paragraphs
  const paragraphs = text.split('\n\n');
  return paragraphs.map(p => {
    const lines = p.trim();
    if (lines.startsWith('<pre>') || lines === '') return lines;
    return `<p>${lines.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copyCode(btn) {
  const code = btn.previousElementSibling.textContent;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✓ Copié';
    setTimeout(() => btn.textContent = 'Copier', 2000);
  });
}

function showTyping() {
  removeWelcome();
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.id = 'typing';

  const label = document.createElement('div');
  label.className = 'msg-label';
  label.textContent = '⚡ CodeMind';

  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  div.appendChild(label);
  div.appendChild(typing);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

const conversationHistory = [];

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  sendBtn.disabled = true;
  inputEl.value = '';
  inputEl.style.height = 'auto';

  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory
      })
    });

    const data = await response.json();
    removeTyping();

    const reply = data.content?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse.";
    conversationHistory.push({ role: 'assistant', content: reply });
    appendMessage('assistant', reply);

  } catch (error) {
    removeTyping();
    appendMessage('assistant', "❌ Erreur de connexion à l'API. Vérifiez votre connexion et réessayez.");
  }

  isLoading = false;
  sendBtn.disabled = false;
  inputEl.focus();
}
