import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Send, Ghost, MessageCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { SkeletonRows } from '../components/Skeleton.jsx';
import { api, getToken } from '../api/client.js';
import { useSound } from '../context/SoundContext.jsx';

export default function Chat() {
  const { play } = useSound();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [incognito, setIncognito] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    api.get('/chat/history?limit=50').then((d) => setMessages(d.messages)).catch(() => setMessages([]));

    const socket = io({ auth: { token: getToken() } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:new', (msg) => {
      setMessages((prev) => [...(prev || []), msg]);
      play('click');
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;
    socketRef.current.emit('chat:message', { text: trimmed, incognito });
    setText('');
  };

  return (
    <Layout title="Chat en vivo" subtitle="Habla con otros jugadores del casino en tiempo real">
      <div className="glass-card flex flex-col h-[70vh] max-h-[720px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MessageCircle size={16} className="text-gold-400" />
            Sala general
          </div>
          <span className={`pill ${connected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
            {connected ? 'Conectado' : 'Conectando…'}
          </span>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!messages ? (
            <SkeletonRows count={5} height="h-10" />
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center mt-6">Todavía no hay mensajes. ¡Sé el primero en escribir!</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                {m.incognito ? (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Ghost size={15} className="text-slate-400" />
                  </div>
                ) : (
                  <UserAvatar avatar={m.avatar} username={m.displayName} size={28} />
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-bold ${m.incognito ? 'text-slate-400 italic' : 'text-gold-300'}`}>
                      {m.displayName}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(m.createdAt || m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 break-words">{m.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={send} className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIncognito((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                incognito ? 'bg-fuchsia-500/15 border-fuchsia-400/40 text-fuchsia-300' : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Ghost size={13} /> Modo incógnito {incognito ? 'activado' : ''}
            </button>
            {incognito && <span className="text-[11px] text-slate-500">Tu nombre no se mostrará en este mensaje</span>}
          </div>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder={incognito ? 'Escribe de forma anónima…' : 'Escribe un mensaje…'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
            />
            <button className="btn-primary !px-4" disabled={!text.trim()}>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
