import type { BusinessConfig, ChatMessage, ExtractedLeadData, Lead } from '../types.ts';

export function sanitizeWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '59177001234';
  if (digits.length === 8 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `591${digits}`;
  }
  return digits;
}

export function buildConversationWhatsappUrl(
  config: BusinessConfig,
  messages: ChatMessage[],
  leadDraft: ExtractedLeadData
): string {
  const targetNumber = sanitizeWhatsappNumber(config.whatsappNumber);
  const lines: string[] = [
    `Hola *${config.businessName}*, les escribo desde el asistente web.`,
    '',
    '*Datos del cliente:*',
    `• Nombre: ${leadDraft.nombre?.trim() || 'Por confirmar'}`,
    `• Teléfono: ${leadDraft.telefono?.trim() || 'Por confirmar'}`,
    `• Necesidad: ${leadDraft.necesidad?.trim() || 'Consulta general'}`,
  ];

  if (leadDraft.cotizacionEstimada) {
    lines.push(`• Cotización referencial: ${leadDraft.cotizacionEstimada}`);
  }

  const recentMessages = messages.slice(-8);
  if (recentMessages.length > 0) {
    lines.push('', '*Resumen de la conversación:*');
    for (const msg of recentMessages) {
      const speaker = msg.role === 'user' ? 'Cliente' : 'Asistente';
      lines.push(`${speaker}: ${msg.content}`);
    }
  }

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${targetNumber}?text=${text}`;
}

export function buildLeadWhatsappUrl(config: BusinessConfig, lead: Lead): string {
  const targetNumber = sanitizeWhatsappNumber(lead.telefono || config.whatsappNumber);
  const text = encodeURIComponent(
    `Hola ${lead.nombre}, le saludamos de ${config.businessName} respecto a su consulta sobre: "${lead.necesidad}". ¿En qué horario podemos coordinar?`
  );
  return `https://wa.me/${targetNumber}?text=${text}`;
}

export function formatTimeShort(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatDateTimeBo(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
