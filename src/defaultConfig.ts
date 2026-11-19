import type { BusinessConfig, Lead } from './types.ts';

export const BRAND_COLOR_OPTIONS = [
  { label: 'Verde Santa Cruz', value: '#0F766E' },
  { label: 'Azul Corporativo', value: '#1E40AF' },
  { label: 'Ámbar Ejecutivo', value: '#B45309' },
  { label: 'Grafito Urbano', value: '#0F172A' },
];

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  businessName: 'TransOriente Express',
  industry: 'Empresa de transporte, encomiendas y mudanzas',
  cityCountry: 'Santa Cruz de la Sierra, Bolivia',
  agentName: 'Valeria · Asesora Virtual',
  agentObjective:
    'Atender clientes con calidez cruceña y profesionalismo, responder preguntas frecuentes usando únicamente la base de conocimiento, cotizar servicios en Bolivianos (Bs) y capturar nombre, teléfono y necesidad del cliente para derivar por WhatsApp cuando corresponda.',
  whatsappNumber: '59177001234',
  brandColor: '#0F766E',
  hours: 'Lunes a viernes de 07:30 a 19:30 · Sábados de 08:00 a 14:00 (Domingos cerrado)',
  address: 'Av. Cristo Redentor, 4to Anillo #415, Santa Cruz de la Sierra, Bolivia',
  services: [
    {
      id: 'srv-1',
      name: 'Encomienda Urbana Express (Santa Cruz)',
      priceBs: '25 Bs',
      unit: 'hasta 5 kg dentro del 4to Anillo',
      description: 'Entrega en el mismo día dentro del radio urbano. Cada kilo adicional cuesta 4 Bs.',
    },
    {
      id: 'srv-2',
      name: 'Encomienda Interdepartamental Santa Cruz – Cochabamba',
      priceBs: '45 Bs',
      unit: 'paquete estándar hasta 5 kg',
      description: 'Salida diaria nocturna con entrega al día siguiente en terminal o sucursal.',
    },
    {
      id: 'srv-3',
      name: 'Encomienda Interdepartamental Santa Cruz – La Paz',
      priceBs: '65 Bs',
      unit: 'paquete estándar hasta 5 kg',
      description: 'Servicio seguro con guía de seguimiento; entrega en 24 a 36 horas.',
    },
    {
      id: 'srv-4',
      name: 'Flete y Mudanza Local (Camión 3.5 Toneladas)',
      priceBs: '350 Bs',
      unit: 'por servicio dentro del 4to Anillo',
      description: 'Incluye chofer y 2 ayudantes por hasta 3 horas. Fuera del 4to Anillo tiene recargo según zona.',
    },
    {
      id: 'srv-5',
      name: 'Transporte Corporativo / Van Ejecutiva (12 pasajeros)',
      priceBs: '480 Bs',
      unit: 'media jornada en ciudad o aeropuerto Viru Viru',
      description: 'Traslado puerta a puerta con aire acondicionado y factura incluida.',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: '¿Emiten factura y aceptan pago por QR?',
      answer:
        'Sí, emitimos factura legal con NIT o CI y aceptamos pagos en efectivo en Bolivianos, transferencia bancaria y QR Simple.',
    },
    {
      id: 'faq-2',
      question: '¿Hacen recojo a domicilio en Santa Cruz?',
      answer:
        'Sí, para encomiendas dentro del 4to Anillo el recojo a domicilio es gratuito en pedidos desde 45 Bs; para envíos menores tiene un costo adicional de 10 Bs.',
    },
    {
      id: 'faq-3',
      question: '¿Qué requisitos necesito para enviar una encomienda?',
      answer:
        'Solo necesita presentar su cédula de identidad vigente y brindar el nombre completo, teléfono y ciudad de destino del destinatario.',
    },
    {
      id: 'faq-4',
      question: '¿Transportan carga pesada o mercancía frágil especial?',
      answer:
        'Para carga superior a 100 kg, maquinaria o artículos de alto valor, un asesor humano realiza la cotización personalizada según volumen y seguro.',
    },
  ],
};

export const INITIAL_SAMPLE_LEADS: Lead[] = [
  {
    id: 'lead-sample-1',
    sessionId: 'demo-1',
    nombre: 'Carlos Mendoza',
    telefono: '76543210',
    necesidad: 'Cotización de mudanza local dentro del 3er Anillo (camión 3.5T)',
    cotizacionEstimada: '350 Bs',
    status: 'Cotizado',
    createdAt: '2026-11-19T09:15:00.000Z',
    updatedAt: '2026-11-19T09:18:00.000Z',
    lastMessageSnippet: 'Perfecto, el camión con 2 ayudantes está en 350 Bs.',
  },
  {
    id: 'lead-sample-2',
    sessionId: 'demo-2',
    nombre: 'Sofía Justiniano',
    telefono: '78120455',
    necesidad: 'Envío de 2 cajas de repuestos a Cochabamba (aprox. 8 kg)',
    cotizacionEstimada: 'Por confirmar peso exacto con asesor',
    status: 'Nuevo',
    createdAt: '2026-11-19T10:02:00.000Z',
    updatedAt: '2026-11-19T10:02:00.000Z',
    lastMessageSnippet: 'Necesito saber si pueden recoger hoy en Equipetrol.',
  },
];
