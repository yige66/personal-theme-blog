'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { KURISU_NO_AIAPI_REPLY } from '@/lib/kurisu-pet-copy';

type PetAction = 'ask' | 'hello' | 'lab' | 'pet';
type PetMood = 'happy' | 'idle' | 'lab' | 'sleepy' | 'thinking';

type PetMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const initialMessages: PetMessage[] = [
  {
    id: 'kurisu-seed',
    role: 'assistant',
    text: '我是牧濑红莉栖。右下角太吵的话，就先保持安静待机。'
  }
];

const moodLabel: Record<PetMood, string> = {
  happy: '收到',
  idle: '待机',
  lab: '实验中',
  sleepy: '低功耗',
  thinking: '分析中'
};

const quickActions: Array<{ action: Exclude<PetAction, 'ask' | 'pet'>; label: string; shortLabel: string }> = [
  { action: 'lab', label: '让红莉栖给一个实验建议', shortLabel: 'β' }
];

export function PixelKurisuPet() {
  const requestIdRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [mood, setMood] = useState<PetMood>('idle');
  const [messages, setMessages] = useState<PetMessage[]>(initialMessages);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  const revealToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setIsToastVisible(true);
    toastTimerRef.current = setTimeout(() => setIsToastVisible(false), 3600);
  }, []);

  const sendToPet = useCallback(async (action: PetAction) => {
    const cleanInput = input.trim().slice(0, 240);
    if (action === 'ask' && !cleanInput) {
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const userText = createUserText(action, cleanInput);
    const pendingId = `kurisu-pending-${requestId}`;
    const userMessage: PetMessage = { id: `user-${requestId}`, role: 'user', text: userText };
    const pendingMessage: PetMessage = { id: pendingId, role: 'assistant', text: '等一下，我正在调用 AI API 整理假设。' };
    const history = messages
      .slice(-6)
      .map((message) => ({ role: message.role, text: message.text }));

    if (action === 'ask' || action === 'lab') {
      setIsOpen(true);
    }
    setIsThinking(true);
    setMood(action === 'lab' ? 'lab' : action === 'pet' ? 'happy' : 'thinking');
    revealToast();
    setMessages((current) => [
      ...current,
      userMessage,
      pendingMessage
    ].slice(-10));

    if (action === 'ask') {
      setInput('');
    }

    try {
      const response = await fetch('/api/kurisu-pet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          message: cleanInput,
          history
        })
      });

      const payload = await response.json() as { code?: string; error?: string; mood?: PetMood; reply?: string; source?: string };

      if (!response.ok) {
        throw new Error(createAiErrorReply(payload.code));
      }

      const reply = typeof payload.reply === 'string' && payload.reply.trim()
        ? payload.reply.trim()
        : createAiErrorReply('ai_empty_reply');

      setMessages((current) => current.map((message) => (
        message.id === pendingId ? { ...message, text: reply } : message
      )));
      setMood(normalizeMood(payload.mood) ?? inferMood(action));
      revealToast();
    } catch {
      const reply = createAiErrorReply('ai_api_unavailable');
      setMessages((current) => current.map((message) => (
        message.id === pendingId ? { ...message, text: reply } : message
      )));
      setMood('thinking');
      revealToast();
    } finally {
      setIsThinking(false);
    }
  }, [input, messages, revealToast]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendToPet('ask');
  }, [sendToPet]);

  const visibleMessages = messages.slice(-4);
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')?.text ?? initialMessages[0].text;

  return (
    <div className="xh-pixel-kurisu-pet" data-open={isOpen ? 'true' : 'false'} data-mood={mood} data-toast={isToastVisible || isThinking ? 'true' : 'false'}>
      {isOpen ? (
        <section className="xh-kurisu-panel" aria-label="牧濑红莉栖问答">
          <header>
            <span>Lab Assistant</span>
            <strong>牧濑红莉栖</strong>
            <button type="button" aria-label="收起牧濑红莉栖问答" onClick={() => setIsOpen(false)}>
              x
            </button>
          </header>
          <div className="xh-kurisu-messages" role="log" aria-live="polite">
            {visibleMessages.map((message) => (
              <p key={message.id} data-role={message.role}>
                {message.text}
              </p>
            ))}
          </div>
          <div className="xh-kurisu-quick-actions" aria-label="红莉栖快速操作">
            {quickActions.map((item) => (
              <button
                key={item.action}
                type="button"
                aria-label={item.label}
                disabled={isThinking}
                onClick={() => void sendToPet(item.action)}
              >
                <span aria-hidden="true">{item.shortLabel}</span>
                <span>{item.label.replace('让红莉栖', '')}</span>
              </button>
            ))}
          </div>
          <form className="xh-kurisu-chatbar" onSubmit={handleSubmit}>
            <input
              aria-label="向牧濑红莉栖提问"
              disabled={isThinking}
              maxLength={240}
              onChange={(event) => setInput(event.target.value)}
              placeholder="向红莉栖提出一个问题..."
              value={input}
            />
            <button type="submit" aria-label="发送给牧濑红莉栖" disabled={isThinking || !input.trim()}>
              <span aria-hidden="true">&gt;</span>
            </button>
          </form>
        </section>
      ) : null}

      {isToastVisible || isThinking ? (
        <div className="xh-kurisu-toast" role="status" aria-live="polite">
          <span>{moodLabel[mood]}</span>
          <strong>{isThinking ? '等一下，我正在调用 AI API 整理假设。' : latestAssistantMessage}</strong>
        </div>
      ) : null}

      <button
        className="xh-kurisu-chat-toggle"
        type="button"
        aria-label={isOpen ? '收起红莉栖问答' : '展开红莉栖问答'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">...</span>
      </button>

      <button
        className="xh-pixel-kurisu-button"
        type="button"
        aria-label="轻点牧濑红莉栖助手"
        disabled={isThinking}
        onClick={() => void sendToPet('pet')}
      >
        <span className="xh-pixel-kurisu" aria-hidden="true">
          <span className="xh-kurisu-shadow" />
          <span className="xh-kurisu-sprite" />
        </span>
      </button>
    </div>
  );
}

function createUserText(action: PetAction, message: string): string {
  if (action === 'lab') {
    return '请红莉栖给一个实验建议';
  }
  if (action === 'hello') {
    return '你好，红莉栖';
  }
  if (action === 'pet') {
    return '轻点红莉栖助手';
  }
  return message;
}

function createAiErrorReply(code: string | undefined): string {
  if (code === 'ai_config_missing' || code === 'ai_api_unavailable') {
    return KURISU_NO_AIAPI_REPLY;
  }
  if (code === 'ai_empty_reply') {
    return 'AI API 没有返回有效内容。这个结果不够严谨，先别当作回答。';
  }
  return 'AI API 暂时没有成功响应。等接口恢复后再问我，贸然给结论可不是实验精神。';
}

function inferMood(action: PetAction): PetMood {
  if (action === 'lab') {
    return 'lab';
  }
  if (action === 'pet' || action === 'hello') {
    return 'happy';
  }
  return 'idle';
}

function normalizeMood(value: PetMood | undefined): PetMood | null {
  if (value === 'happy' || value === 'idle' || value === 'lab' || value === 'sleepy' || value === 'thinking') {
    return value;
  }
  return null;
}
