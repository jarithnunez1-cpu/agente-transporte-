import { useMemo, useState } from 'react';
import { Download, MessageCircle, Plus, Search, Trash2 } from 'lucide-react';
import type { BusinessConfig, Lead, LeadStatus } from '../types.ts';
import { buildLeadWhatsappUrl, formatDateTimeBo } from '../utils/whatsapp.ts';

interface LeadsPanelProps {
  config: BusinessConfig;
  leads: Lead[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: LeadStatus) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onCreateLead: (payload: {
    nombre: string;
    telefono: string;
    necesidad: string;
    cotizacionEstimada: string;
  }) => Promise<void>;
  onGoToChat: () => void;
}

const STATUS_FILTERS: Array<'Todos' | LeadStatus> = ['Todos', 'Nuevo', 'Contactado', 'Cotizado'];

export function LeadsPanel({
  config,
  leads,
  isLoading,
  onUpdateStatus,
  onDeleteLead,
  onCreateLead,
  onGoToChat,
}: LeadsPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | LeadStatus>('Todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newNecesidad, setNewNecesidad] = useState('');
  const [newCotizacion, setNewCotizacion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        lead.nombre.toLowerCase().includes(query) ||
        lead.telefono.toLowerCase().includes(query) ||
        lead.necesidad.toLowerCase().includes(query)
      );
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: leads.length,
      nuevo: leads.filter((l) => l.status === 'Nuevo').length,
      cotizado: leads.filter((l) => l.status === 'Cotizado').length,
      contactado: leads.filter((l) => l.status === 'Contactado').length,
    };
  }, [leads]);

  function handleExportCsv() {
    const header = ['Nombre', 'Teléfono', 'Necesidad', 'Cotización', 'Estado', 'Fecha'];
    const rows = filteredLeads.map((l) => [
      `"${l.nombre.replace(/"/g, '""')}"`,
      `"${l.telefono.replace(/"/g, '""')}"`,
      `"${l.necesidad.replace(/"/g, '""')}"`,
      `"${l.cotizacionEstimada.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${formatDateTimeBo(l.updatedAt)}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${config.businessName.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newNombre.trim() && !newTelefono.trim()) return;
    setSubmitting(true);
    try {
      await onCreateLead({
        nombre: newNombre.trim(),
        telefono: newTelefono.trim(),
        necesidad: newNecesidad.trim() || 'Consulta general',
        cotizacionEstimada: newCotizacion.trim() || 'Por confirmar',
      });
      setNewNombre('');
      setNewTelefono('');
      setNewNecesidad('');
      setNewCotizacion('');
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  function renderStatusLabel(status: LeadStatus) {
    if (status === 'Nuevo') return 'text-amber-700';
    if (status === 'Cotizado') return 'text-teal-700';
    return 'text-slate-700';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Registro comercial · {config.businessName}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-1">
            Leads capturados
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5 tabular-nums">
            <span>{counts.total} totales</span>
            <span aria-hidden="true">·</span>
            <span>{counts.nuevo} nuevos</span>
            <span aria-hidden="true">·</span>
            <span>{counts.cotizado} cotizados</span>
            <span aria-hidden="true">·</span>
            <span>{counts.contactado} contactados</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: config.brandColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar lead</span>
          </button>
        </div>
      </div>

      {/* Inline Add Lead Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="mb-6 bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Ej. Paola Suárez"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
              required
              value={newTelefono}
              onChange={(e) => setNewTelefono(e.target.value)}
              placeholder="76001122"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Necesidad</label>
            <input
              type="text"
              value={newNecesidad}
              onChange={(e) => setNewNecesidad(e.target.value)}
              placeholder="Ej. Traslado ejecutivo Viru Viru"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-4 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: config.brandColor }}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-2 px-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o servicio..."
              className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              No hay leads que coincidan con el filtro actual.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cuando un cliente comparta su nombre o teléfono en el chat, aparecerá aquí automáticamente.
            </p>
            <button
              type="button"
              onClick={onGoToChat}
              className="mt-4 inline-flex items-center px-4 py-2 text-xs font-medium text-white rounded-lg"
              style={{ backgroundColor: config.brandColor }}
            >
              Ir al Asistente IA
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Necesidad</th>
                    <th className="py-3 px-4">Cotización</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {lead.nombre}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {lead.telefono}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 max-w-xs">
                        <p className="line-clamp-2">{lead.necesidad}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                        {lead.cotizacionEstimada || 'Por confirmar'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Estado de ${lead.nombre}`}
                          value={lead.status}
                          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs font-medium bg-transparent border border-slate-200 rounded-md px-2 py-1 focus:outline-none ${renderStatusLabel(
                            lead.status
                          )}`}
                        >
                          <option value="Nuevo">Nuevo</option>
                          <option value="Cotizado">Cotizado</option>
                          <option value="Contactado">Contactado</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDateTimeBo(lead.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={buildLeadWhatsappUrl(config, lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Escribir por WhatsApp"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => onDeleteLead(lead.id)}
                            title="Eliminar lead"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{lead.nombre}</p>
                      <p className="text-xs font-mono text-slate-600 tabular-nums mt-0.5">
                        {lead.telefono} · {formatDateTimeBo(lead.updatedAt)}
                      </p>
                    </div>
                    <select
                      aria-label={`Estado de ${lead.nombre}`}
                      value={lead.status}
                      onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                      className={`text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-1 ${renderStatusLabel(
                        lead.status
                      )}`}
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Cotizado">Cotizado</option>
                      <option value="Contactado">Contactado</option>
                    </select>
                  </div>

                  <p className="text-xs text-slate-700">{lead.necesidad}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-medium text-slate-800 tabular-nums">
                      {lead.cotizacionEstimada || 'Por confirmar'}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={buildLeadWhatsappUrl(config, lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                        style={{ backgroundColor: config.brandColor }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteLead(lead.id)}
                        aria-label={`Eliminar ${lead.nombre}`}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
