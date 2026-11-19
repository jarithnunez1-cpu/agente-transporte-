export type LeadStatus = 'Nuevo' | 'Contactado' | 'Cotizado';

export interface ServiceItem {
  id: string;
  name: string;
  priceBs: string;
  unit: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BusinessConfig {
  businessName: string;
  industry: string;
  cityCountry: string;
  agentName: string;
  agentObjective: string;
  whatsappNumber: string;
  brandColor: string;
  hours: string;
  address: string;
  services: ServiceItem[];
  faqs: FaqItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiereHumano?: boolean;
  cotizacionEstimada?: string | null;
}

export interface ExtractedLeadData {
  nombre: string | null;
  telefono: string | null;
  necesidad: string | null;
  cotizacionEstimada: string | null;
}

export interface Lead {
  id: string;
  sessionId: string;
  nombre: string;
  telefono: string;
  necesidad: string;
  cotizacionEstimada: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
}
