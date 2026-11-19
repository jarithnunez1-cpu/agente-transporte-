import { useEffect, useMemo, useState } from 'react';
import { ChatWorkspace } from './components/ChatWorkspace.tsx';
import { ConfigStudio } from './components/ConfigStudio.tsx';
import { LeadsPanel } from './components/LeadsPanel.tsx';
import { TopBar, type ActiveTab } from './components/TopBar.tsx';
import { DEFAULT_BUSINESS_CONFIG } from './defaultConfig.ts';
import type { BusinessConfig, ChatMessage, ExtractedLeadData, Lead, LeadStatus } from './types.ts';
import { buildConversationWhatsappUrl } from './utils/whatsapp.ts';

const STORAGE_SESSION_KEY = 'ai_agent_session_id_v1';
const STORAGE_MESSAGES_KEY = 'ai_agent_messages_v1';
const STORAGE_DRAFT_KEY = 'ai_agent_lead_draft_v1';

function createInitialGreeting(cfg: BusinessConfig): ChatMessage {
  return {
    id: 'msg-welcome',
    role: 'assistant',
    content: `¡Buenos días! Soy ${cfg.agentName.split('·')[0].trim()} de ${cfg.businessName}. ¿En qué servicio puedo ayudarle hoy? Con gusto le doy precios en Bolivianos o tomo sus datos para cotizar.`,
    timestamp: new Date().toISOString(),
  };
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(STORAGE_SESSION_KEY);
  if (existing) return existing;
  const fresh = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  localStorage.setItem(STORAGE_SESSION_KEY, fresh);
  return fresh;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_BUSINESS_CONFIG);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default greeting
    }
    return [createInitialGreeting(DEFAULT_BUSINESS_CONFIG)];
  });

  const [leadDraft, setLeadDraft] = useState<ExtractedLeadData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) return JSON.parse(saved) as ExtractedLeadData;
    } catch {
      // Ignore parse errors
    }
    return { nombre: null, telefono: null, necesidad: null, cotizacionEstimada: null };
  });

  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [leadSavedNotice, setLeadSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(leadDraft));
  }, [leadDraft]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', config.brandColor);
    document.title = `${config.businessName} · Asistente IA`;
  }, [config.brandColor, config.businessName]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cfgRes, leadsRes] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/leads'),
        ]);
        if (cfgRes.ok) {
          const cfgData = (await cfgRes.json()) as BusinessConfig;
          setConfig(cfgData);
        }
        if (leadsRes.ok) {
          const leadsData = (await leadsRes.json()) as Lead[];
          setLeads(leadsData);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      } finally {
        setLoadingLeads(false);
      }
    }
    loadInitialData();
  }, []);

  async function refreshLeads() {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = (await res.json()) as Lead[];
        setLeads(data);
      }
    } catch {
      // Keep current list on transient failure
    }
  }

  async function handleSendMessage(text: string) {
    setChatError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          history: messages,
          currentLeadDraft: leadDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servidor.');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        requiereHumano: Boolean(data.requiereHumano),
        cotizacionEstimada: data.extractedLead?.cotizacionEstimada ?? null,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.extractedLead) {
        setLeadDraft((prev) => ({
          nombre: data.extractedLead.nombre || prev.nombre,
          telefono: data.extractedLead.telefono || prev.telefono,
          necesidad: data.extractedLead.necesidad || prev.necesidad,
          cotizacionEstimada: data.extractedLead.cotizacionEstimada || prev.cotizacionEstimada,
        }));
      }

      if (data.savedLead) {
        setLeadSavedNotice('Datos registrados automáticamente en el Panel de Leads.');
        setTimeout(() => setLeadSavedNotice(null), 3500);
        await refreshLeads();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el asistente.';
      setChatError(msg);
    } finally {
      setIsSending(false);
    }
  }

  function handleResetChat() {
    const freshSession = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem(STORAGE_SESSION_KEY, freshSession);
    setSessionId(freshSession);
    setMessages([createInitialGreeting(config)]);
    setLeadDraft({ nombre: null, telefono: null, necesidad: null, cotizacionEstimada: null });
    setChatError(null);
    setLeadSavedNotice(null);
  }

  function handleUpdateLeadDraft(patch: Partial<ExtractedLeadData>) {
    setLeadDraft((prev) => ({ ...prev, ...patch }));
  }

  async function handleManualSaveLead() {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        nombre: leadDraft.nombre ?? '',
        telefono: leadDraft.telefono ?? '',
        necesidad: leadDraft.necesidad ?? 'Consulta general',
        cotizacionEstimada: leadDraft.cotizacionEstimada ?? 'Por confirmar',
        lastMessageSnippet: messages[messages.length - 1]?.content?.slice(0, 120) ?? '',
      }),
    });

    if (res.ok) {
      setLeadSavedNotice('Lead guardado correctamente en el panel.');
      setTimeout(() => setLeadSavedNotice(null), 3000);
      await refreshLeads();
    }
  }

  async function handleUpdateLeadStatus(id: string, status: LeadStatus) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    }
  }

  async function handleDeleteLead(id: string) {
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  }

  async function handleCreateManualLead(payload: {
    nombre: string;
    telefono: string;
    necesidad: string;
    cotizacionEstimada: string;
  }) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await refreshLeads();
    }
  }

  async function handleSaveConfig(nextConfig: BusinessConfig) {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextConfig),
    });
    if (res.ok) {
      const saved = (await res.json()) as BusinessConfig;
      setConfig(saved);
    }
  }

  const topbarWhatsappUrl = useMemo(
    () => buildConversationWhatsappUrl(config, messages, leadDraft),
    [config, messages, leadDraft]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        businessName={config.businessName}
        brandColor={config.brandColor}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        leadsCount={leads.length}
        whatsappUrl={topbarWhatsappUrl}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatWorkspace
            config={config}
            messages={messages}
            leadDraft={leadDraft}
            isSending={isSending}
            errorMessage={chatError}
            leadSavedNotice={leadSavedNotice}
            onSendMessage={handleSendMessage}
            onResetChat={handleResetChat}
            onUpdateLeadDraft={handleUpdateLeadDraft}
            onManualSaveLead={handleManualSaveLead}
            onNavigateLeads={() => setActiveTab('leads')}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsPanel
            config={config}
            leads={leads}
            isLoading={loadingLeads}
            onUpdateStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLead}
            onCreateLead={handleCreateManualLead}
            onGoToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'config' && (
          <ConfigStudio config={config} onSaveConfig={handleSaveConfig} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {config.businessName} · {config.cityCountry}
          </span>
          <span>
            {config.hours} · WhatsApp +{config.whatsappNumber}
          </span>
        </div>
      </footer>
    </div>
  );
}
