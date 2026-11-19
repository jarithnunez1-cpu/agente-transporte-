import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  User,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import type { BusinessConfig, ChatMessage, ExtractedLeadData } from '../types.ts';
import { buildConversationWhatsappUrl, formatTimeShort } from '../utils/whatsapp.ts';

interface ChatWorkspaceProps {
  config: BusinessConfig;
  messages: ChatMessage[];
  leadDraft: ExtractedLeadData;
  isSending: boolean;
  errorMessage: string | null;
  leadSavedNotice: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onResetChat: () => void;
  onUpdateLeadDraft: (patch: Partial<ExtractedLeadData>) => void;
  onManualSaveLead: () => Promise<void>;
  onNavigateLeads: () => void;
}

const ADVISOR_AVATAR_URL = '/src/assets/images/agent_avatar_santacruz_1795086288646.jpg';

export function ChatWorkspace({
  config,
  messages,
  leadDraft,
  isSending,
  errorMessage,
  leadSavedNotice,
  onSendMessage,
  onResetChat,
  onUpdateLeadDraft,
  onManualSaveLead,
  onNavigateLeads,
}: ChatWorkspaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const whatsappUrl = buildConversationWhatsappUrl(config, messages, leadDraft);

  const quickPrompts = [
    '¿Cuánto cuesta una encomienda en Santa Cruz?',
    'Necesito cotizar una mudanza local',
    '¿Cuál es su horario y dirección?',
    '¿Hacen envíos a Cochabamba o La Paz?',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;
    setInputValue('');
    await onSendMessage(trimmed);
  }

  async function handleQuickPrompt(prompt: string) {
    if (isSending) return;
    await onSendMessage(prompt);
  }

  async function handleSaveLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingLead(true);
    try {
      await onManualSaveLead();
    } finally {
      setSavingLead(false);
    }
  }

  async function handleCopySummary() {
    const lines = [
      `${config.businessName} - Resumen de consulta`,
      `Cliente: ${leadDraft.nombre || 'Por confirmar'}`,
      `Teléfono: ${leadDraft.telefono || 'Por confirmar'}`,
      `Necesidad: ${leadDraft.necesidad || 'Consulta general'}`,
      '',
      ...messages.slice(-6).map((m) => `${m.role === 'user' ? 'Cliente' : 'Asistente'}: ${m.content}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Clipboard blocked in restricted browser contexts
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      {/* Compact Business Context Intro */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {config.industry} · {config.cityCountry}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-1">
            Atención y cotizaciones al instante
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <button
            type="button"
            onClick={onNavigateLeads}
            className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap"
          >
            Ver panel de leads
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-Column Balanced Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Real-Time Conversational Agent */}
        <section
          aria-label="Chat en tiempo real"
          className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[540px] lg:h-[680px]"
        >
          {/* Chat Header */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {!avatarFailed ? (
                <img
                  src={ADVISOR_AVATAR_URL}
                  alt={config.agentName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: config.brandColor }}
                >
                  {config.businessName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 truncate">{config.agentName}</h2>
                <p className="text-xs text-slate-500 truncate">
                  Respuestas basadas en tarifario oficial · Precios en Bs
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva charla</span>
            </button>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'text-white'
                        : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                    style={isUser ? { backgroundColor: config.brandColor } : undefined}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {!isUser && msg.requiereHumano && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
                          style={{ backgroundColor: config.brandColor }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hablar con asesor por WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-slate-400 tabular-nums">
                    {isUser ? 'Usted' : config.agentName.split('·')[0].trim()} · {formatTimeShort(msg.timestamp)}
                  </span>
                </div>
              );
            })}

            {isSending && (
              <div className="flex flex-col items-start">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
                  Consultando base de información...
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
              >
                <strong className="font-semibold">No se pudo responder:</strong> {errorMessage}
              </div>
            )}

            <div ref={threadEndRef} />
          </div>

          {/* Quick Starter Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-left text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Composer */}
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 border-t border-slate-200 bg-white rounded-b-xl flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escriba su consulta o sus datos (nombre, teléfono, servicio)..."
              disabled={isSending}
              className="flex-1 min-w-0 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap shrink-0 min-h-[42px]"
              style={{ backgroundColor: config.brandColor }}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </section>

        {/* Right Column: Lead Capture + Official Knowledge Reference */}
        <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          {/* Lead Capture Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Ficha del cliente (Lead)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Se completa automáticamente desde el chat o manualmente.
                </p>
              </div>
              {leadDraft.cotizacionEstimada && (
                <span className="text-xs font-mono font-medium text-slate-800 tabular-nums shrink-0">
                  {leadDraft.cotizacionEstimada}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveLeadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="lead-nombre">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="lead-nombre"
                    type="text"
                    value={leadDraft.nombre ?? ''}
                    onChange={(e) => onUpdateLeadDraft({ nombre: e.target.value })}
                    placeholder="Ej. Juan Pablo Arce"
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="lead-telefono">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="lead-telefono"
                    type="tel"
                    value={leadDraft.telefono ?? ''}
                    onChange={(e) => onUpdateLeadDraft({ telefono: e.target.value })}
                    placeholder="Ej. 76543210"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="lead-necesidad">
                  Servicio o necesidad
                </label>
                <textarea
                  id="lead-necesidad"
                  rows={2}
                  value={leadDraft.necesidad ?? ''}
                  onChange={(e) => onUpdateLeadDraft({ necesidad: e.target.value })}
                  placeholder="Ej. Envío de encomienda 4 kg a Cochabamba"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 resize-none"
                />
              </div>

              {leadSavedNotice && (
                <p className="text-xs font-medium text-teal-700">{leadSavedNotice}</p>
              )}

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={savingLead || (!leadDraft.nombre?.trim() && !leadDraft.telefono?.trim())}
                  className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
                  style={{ backgroundColor: config.brandColor }}
                >
                  {savingLead ? 'Guardando...' : 'Guardar en Panel de Leads'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Copiado' : 'Copiar chat'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Official Knowledge Quick Reference (No Nested Cards) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Tarifario oficial y ubicación
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Únicos precios autorizados para el asistente.
            </p>

            <div className="divide-y divide-slate-100">
              {config.services.slice(0, 4).map((srv) => (
                <div key={srv.id} className="py-2.5 first:pt-0 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{srv.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{srv.unit}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                    {srv.priceBs}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{config.hours}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{config.address}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
