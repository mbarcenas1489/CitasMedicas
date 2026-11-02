import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MedicalAppointment,
  AppointmentStatus,
  DailyTimeSlot,
  DEFAULT_TIME_SLOTS,
} from '@/types/appointment';

interface AppointmentsContextType {
  appointments: MedicalAppointment[];
  loading: boolean;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  addAppointment: (
    data: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<MedicalAppointment>;
  updateAppointment: (id: string, data: Partial<MedicalAppointment>) => Promise<void>;
  updateStatus: (id: string, status: AppointmentStatus, cancellationReason?: string) => Promise<void>;
  reprogramAppointment: (
    id: string,
    newDate: string,
    newTimeSlot: string,
    reason?: string
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsForDate: (date: string) => MedicalAppointment[];
  getTimeSlotsForDate: (date: string) => DailyTimeSlot[];
  getAppointmentById: (id: string) => MedicalAppointment | undefined;
  datesWithAppointments: Record<string, { count: number; statuses: AppointmentStatus[] }>;
  resetToSampleData: () => Promise<void>;
}

const STORAGE_KEY = '@citas_medicas_v1';

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AppointmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  useEffect(() => {
    loadAppointments();
  }, []);

  const saveAppointments = async (newAppointments: MedicalAppointment[]) => {
    setAppointments(newAppointments);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
      }
    } catch (error) {
      console.warn('Advertencia al guardar en AsyncStorage (usando memoria):', error);
    }
  };

  const getSampleAppointments = (): MedicalAppointment[] => {
    const today = getTodayString();
    const tomorrow = getOffsetDateString(1);
    const dayAfter = getOffsetDateString(2);

    return [
      {
        id: 'seed-1',
        patientName: 'Carlos Mendoza',
        patientPhone: '+57 310 456 7890',
        doctorName: 'Dra. María Elena Gómez',
        specialty: 'Cardiología',
        date: today,
        timeSlot: '08:00 - 09:00',
        status: 'confirmada',
        reason: 'Revisión y control de presión arterial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-2',
        patientName: 'Lucía Fernández',
        patientPhone: '+57 312 987 6543',
        doctorName: 'Dr. Alejandro Ruiz',
        specialty: 'Pediatría',
        date: today,
        timeSlot: '10:00 - 11:00',
        status: 'pendiente',
        reason: 'Control rutinario de 6 meses y vacunas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-3',
        patientName: 'Andrés Felipe Morales',
        patientPhone: '+57 315 222 3344',
        doctorName: 'Dra. Sofía Vargas',
        specialty: 'Dermatología',
        date: today,
        timeSlot: '14:00 - 15:00',
        status: 'cancelada',
        reason: 'Consulta por dermatitis en brazos',
        cancellationReason: 'El paciente notificó que no puede asistir por viaje imprevisto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-4',
        patientName: 'Valentina Restrepo',
        patientPhone: '+57 320 888 9911',
        doctorName: 'Dr. Roberto Navarro',
        specialty: 'Traumatología',
        date: today,
        timeSlot: '16:00 - 17:00',
        status: 'reprogramada',
        reason: 'Dolor agudo en rodilla derecha',
        reprogrammedInfo: {
          originalDate: getOffsetDateString(-1),
          originalTimeSlot: '11:00 - 12:00',
          reason: 'Médico en cirugía de emergencia',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-5',
        patientName: 'Guillermo Ortiz',
        patientPhone: '+57 301 555 4433',
        doctorName: 'Dra. Carolina Castro',
        specialty: 'Oftalmología',
        date: tomorrow,
        timeSlot: '09:00 - 10:00',
        status: 'confirmada',
        reason: 'Examen de agudeza visual y cambio de lentes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'seed-6',
        patientName: 'Juliana Pardo',
        patientPhone: '+57 318 444 1122',
        doctorName: 'Dr. Mateo Silva',
        specialty: 'Odontología',
        date: dayAfter,
        timeSlot: '11:00 - 12:00',
        status: 'pendiente',
        reason: 'Limpieza dental semestral',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let loaded = false;
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: MedicalAppointment[] = JSON.parse(stored);
          setAppointments(parsed);
          loaded = true;
        }
      }
      if (!loaded) {
        const initial = getSampleAppointments();
        setAppointments(initial);
        await saveAppointments(initial);
      }
    } catch (error) {
      console.warn('AsyncStorage no disponible, usando almacenamiento en memoria:', error);
      setAppointments(getSampleAppointments());
    } finally {
      setLoading(false);
    }
  };

  const resetToSampleData = async () => {
    const samples = getSampleAppointments();
    await saveAppointments(samples);
  };

  const addAppointment = async (
    data: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MedicalAppointment> => {
    const newAppointment: MedicalAppointment = {
      ...data,
      id: `cita_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...appointments, newAppointment];
    await saveAppointments(updated);
    return newAppointment;
  };

  const updateAppointment = async (id: string, data: Partial<MedicalAppointment>) => {
    const updated = appointments.map((appt) =>
      appt.id === id
        ? { ...appt, ...data, updatedAt: new Date().toISOString() }
        : appt
    );
    await saveAppointments(updated);
  };

  const updateStatus = async (
    id: string,
    status: AppointmentStatus,
    cancellationReason?: string
  ) => {
    const updated = appointments.map((appt) => {
      if (appt.id === id) {
        return {
          ...appt,
          status,
          ...(cancellationReason !== undefined ? { cancellationReason } : {}),
          updatedAt: new Date().toISOString(),
        };
      }
      return appt;
    });
    await saveAppointments(updated);
  };

  const reprogramAppointment = async (
    id: string,
    newDate: string,
    newTimeSlot: string,
    reason?: string
  ) => {
    const updated = appointments.map((appt) => {
      if (appt.id === id) {
        return {
          ...appt,
          date: newDate,
          timeSlot: newTimeSlot,
          status: 'reprogramada' as AppointmentStatus,
          reprogrammedInfo: {
            originalDate: appt.date,
            originalTimeSlot: appt.timeSlot,
            reason: reason || 'Reprogramada a solicitud del usuario/médico',
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return appt;
    });
    await saveAppointments(updated);
  };

  const deleteAppointment = async (id: string) => {
    const updated = appointments.filter((appt) => appt.id !== id);
    await saveAppointments(updated);
  };

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter((appt) => appt.date === date);
  };

  const getTimeSlotsForDate = (date: string): DailyTimeSlot[] => {
    const dayAppointments = getAppointmentsForDate(date);

    return DEFAULT_TIME_SLOTS.map((slot) => {
      const [start, end] = slot.split(' - ');
      // Look for an active appointment in this slot (or the most recently updated if multiple)
      const matchingAppt = dayAppointments.find((appt) => appt.timeSlot === slot);

      return {
        id: `${date}_${slot}`,
        startTime: start,
        endTime: end,
        label: slot,
        appointment: matchingAppt,
      };
    });
  };

  const getAppointmentById = (id: string) => {
    return appointments.find((appt) => appt.id === id);
  };

  // Map of dates having appointments, for dot markers in calendar
  const datesWithAppointments = useMemo(() => {
    const map: Record<string, { count: number; statuses: AppointmentStatus[] }> = {};
    for (const appt of appointments) {
      if (!map[appt.date]) {
        map[appt.date] = { count: 0, statuses: [] };
      }
      map[appt.date].count += 1;
      if (!map[appt.date].statuses.includes(appt.status)) {
        map[appt.date].statuses.push(appt.status);
      }
    }
    return map;
  }, [appointments]);

  return (
    <AppointmentsContext.Provider
      value={{
        appointments,
        loading,
        selectedDate,
        setSelectedDate,
        addAppointment,
        updateAppointment,
        updateStatus,
        reprogramAppointment,
        deleteAppointment,
        getAppointmentsForDate,
        getTimeSlotsForDate,
        getAppointmentById,
        datesWithAppointments,
        resetToSampleData,
      }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments debe usarse dentro de un AppointmentsProvider');
  }
  return context;
};

