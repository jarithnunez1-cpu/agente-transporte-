import { useState } from 'react';
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { BRAND_COLOR_OPTIONS, DEFAULT_BUSINESS_CONFIG } from '../defaultConfig.ts';
import type { BusinessConfig, FaqItem, ServiceItem } from '../types.ts';

interface ConfigStudioProps {
  config: BusinessConfig;
  onSaveConfig: (next: BusinessConfig) => Promise<void>;
}

const FLEET_HERO_URL = '/src/assets/images/hero_transport_santacruz_1795086288460.jpg';

export function ConfigStudio({ config, onSaveConfig }: ConfigStudioProps) {
  const [draft, setDraft] = useState<BusinessConfig>(config);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  function updateService(id: string, patch: Partial<ServiceItem>) {
    setDraft((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function addService() {
    setDraft((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: `srv-${Date.now()}`,
          name: 'Nuevo servicio',
          priceBs: '50 Bs',
          unit: 'por servicio',
          description: 'Detalle del alcance y condiciones.',
        },
      ],
    }));
  }

  function removeService(id: string) {
    setDraft((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  }

  function updateFaq(id: string, patch: Partial<FaqItem>) {
    setDraft((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }

  function addFaq() {
    setDraft((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          id: `faq-${Date.now()}`,
          question: '¿Nueva pregunta frecuente?',
          answer: 'Respuesta oficial basada en políticas de la empresa.',
        },
      ],
    }));
  }

  function removeFaq(id: string) {
    setDraft((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig(draft);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefault() {
    setDraft(DEFAULT_BUSINESS_CONFIG);
    setSaving(true);
    try {
      await onSaveConfig(DEFAULT_BUSINESS_CONFIG);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 grid grid-cols-1 md:grid-cols-12 items-stretch">
        <div className="md:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Base de información oficial · Gemini API
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-1">
              Conocimiento y marca del agente
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              El asistente responde únicamente con los servicios, tarifas en Bolivianos (Bs), horarios y
              preguntas frecuentes configuradas aquí. Si un cliente consulta algo fuera de esta lista,
              lo deriva a un asesor humano por WhatsApp.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRestoreDefault}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar ejemplo Santa Cruz</span>
            </button>
          </div>
        </div>

        <div className="md:col-span-5 min-h-[180px] bg-slate-100 relative">
          {!heroFailed ? (
            <img
              src={FLEET_HERO_URL}
              alt={`Flota operativa de ${draft.businessName}`}
              referrerPolicy="no-referrer"
              onError={() => setHeroFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-center text-xs text-slate-500">
              {draft.businessName} · {draft.cityCountry}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identidad y WhatsApp */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            01. Identidad del negocio y canal WhatsApp
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre de la empresa
              </label>
              <input
                type="text"
                required
                value={draft.businessName}
                onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Rubro / Negocio
              </label>
              <input
                type="text"
                required
                value={draft.industry}
                onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre del agente virtual
              </label>
              <input
                type="text"
                required
                value={draft.agentName}
                onChange={(e) => setDraft({ ...draft, agentName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Número de WhatsApp destino (código país + número)
              </label>
              <input
                type="text"
                required
                value={draft.whatsappNumber}
                onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
                placeholder="59177001234"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ciudad y país
              </label>
              <input
                type="text"
                required
                value={draft.cityCountry}
                onChange={(e) => setDraft({ ...draft, cityCountry: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Color principal de marca
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {BRAND_COLOR_OPTIONS.map((opt) => {
                  const selected = draft.brandColor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft({ ...draft, brandColor: opt.value })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selected
                          ? 'border-slate-900 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: opt.value }}
                      />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Horarios de atención
              </label>
              <input
                type="text"
                required
                value={draft.hours}
                onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dirección / Ubicación
              </label>
              <input
                type="text"
                required
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Objetivo e instrucciones del agente
            </label>
            <textarea
              rows={2}
              value={draft.agentObjective}
              onChange={(e) => setDraft({ ...draft, agentObjective: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
        </section>

        {/* Servicios y Precios en Bs */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              02. Servicios y precios en Bolivianos (Bs)
            </h2>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar servicio</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {draft.services.map((srv) => (
              <div key={srv.id} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Servicio</label>
                  <input
                    type="text"
                    value={srv.name}
                    onChange={(e) => updateService(srv.id, { name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Precio (Bs)</label>
                  <input
                    type="text"
                    value={srv.priceBs}
                    onChange={(e) => updateService(srv.id, { priceBs: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Unidad / Condición</label>
                  <input
                    type="text"
                    value={srv.unit}
                    onChange={(e) => updateService(srv.id, { unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Detalle</label>
                  <input
                    type="text"
                    value={srv.description}
                    onChange={(e) => updateService(srv.id, { description: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-1 flex md:justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => removeService(srv.id)}
                    aria-label={`Eliminar ${srv.name}`}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preguntas Frecuentes */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              03. Preguntas frecuentes (FAQ)
            </h2>
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar FAQ</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {draft.faqs.map((faq) => (
              <div key={faq.id} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Pregunta</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Respuesta oficial</label>
                  <input
                    type="text"
                    value={faq.answer}
                    onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="md:col-span-1 flex md:justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => removeFaq(faq.id)}
                    aria-label="Eliminar pregunta frecuente"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
              <Check className="w-4 h-4" />
              Base de conocimiento guardada
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: draft.brandColor }}
          >
            {saving ? 'Guardando cambios...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
