export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'reprogramada';

export interface MedicalAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorName?: string;
  specialty?: string;
  date: string; // Formato YYYY-MM-DD
  timeSlot: string; // Ej: "08:00 - 09:00"
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  reprogrammedInfo?: {
    originalDate: string;
    originalTimeSlot: string;
    reason?: string;
  };
}

export interface DailyTimeSlot {
  id: string;
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  label: string; // "08:00 - 09:00"
  appointment?: MedicalAppointment;
}

export const DEFAULT_TIME_SLOTS: string[] = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
];

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  confirmada: {
    label: 'Confirmada',
    color: '#059669', // Emerald 600
    bgColor: '#D1FAE5', // Emerald 100
    borderColor: '#34D399',
    icon: 'checkmark-circle',
  },
  pendiente: {
    label: 'Pendiente',
    color: '#D97706', // Amber 600
    bgColor: '#FEF3C7', // Amber 100
    borderColor: '#FBBF24',
    icon: 'time',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#DC2626', // Red 600
    bgColor: '#FEE2E2', // Red 100
    borderColor: '#F87171',
    icon: 'close-circle',
  },
  reprogramada: {
    label: 'Reprogramada',
    color: '#7C3AED', // Violet 600
    bgColor: '#EDE9FE', // Violet 100
    borderColor: '#A78BFA',
    icon: 'calendar',
  },
};

export const MEDICAL_SPECIALTIES = [
  'Medicina General',
  'Pediatría',
  'Cardiología',
  'Dermatología',
  'Ginecología',
  'Traumatología',
  'Oftalmología',
  'Odontología',
  'Neurología',
  'Psicología',
];

