import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppointments } from '@/context/AppointmentsContext';
import { CalendarStrip } from '@/components/CalendarStrip';
import { TimeSlotItem } from '@/components/TimeSlotItem';
import { AppointmentModal } from '@/components/AppointmentModal';
import { StatusModal } from '@/components/StatusModal';
import { ReprogramModal } from '@/components/ReprogramModal';
import { MedicalAppointment, AppointmentStatus } from '@/types/appointment';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type FilterType = 'todas' | 'libres' | AppointmentStatus;

const DAYS_LONG_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
const MONTHS_LONG_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const {
    loading,
    selectedDate,
    getTimeSlotsForDate,
    getAppointmentsForDate,
  } = useAppointments();

  // Modals state
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [targetSlotForNew, setTargetSlotForNew] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<MedicalAppointment | null>(null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeAppointmentForStatus, setActiveAppointmentForStatus] =
    useState<MedicalAppointment | null>(null);

  const [reprogramModalVisible, setReprogramModalVisible] = useState(false);
  const [activeAppointmentForReprogram, setActiveAppointmentForReprogram] =
    useState<MedicalAppointment | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');

  // Formatted date string for header
  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayName = DAYS_LONG_ES[d.getDay()];
    const monthName = MONTHS_LONG_ES[d.getMonth()];
    return `${dayName}, ${d.getDate()} de ${monthName}`;
  }, [selectedDate]);

  // Appointments for selected date
  const dayAppointments = useMemo(() => {
    return getAppointmentsForDate(selectedDate);
  }, [getAppointmentsForDate, selectedDate]);

  // Daily statistics
  const stats = useMemo(() => {
    const counts = {
      total: dayAppointments.length,
      confirmada: 0,
      pendiente: 0,
      cancelada: 0,
      reprogramada: 0,
    };
    for (const appt of dayAppointments) {
      if (counts[appt.status] !== undefined) {
        counts[appt.status]++;
      }
    }
    return counts;
  }, [dayAppointments]);

  // Filtered daily time slots
  const allSlots = getTimeSlotsForDate(selectedDate);
  const filteredSlots = useMemo(() => {
    if (activeFilter === 'todas') return allSlots;
    if (activeFilter === 'libres') return allSlots.filter((s) => !s.appointment);
    return allSlots.filter((s) => s.appointment?.status === activeFilter);
  }, [allSlots, activeFilter]);

  // Open modal for new appointment in a specific slot
  const handleAddInSlot = (slotLabel: string) => {
    setEditingAppointment(null);
    setTargetSlotForNew(slotLabel);
    setAppointmentModalVisible(true);
  };

  // Open modal for new appointment from FAB
  const handleAddNewGeneral = () => {
    setEditingAppointment(null);
    setTargetSlotForNew(undefined);
    setAppointmentModalVisible(true);
  };

  // Open edit modal
  const handleEditAppointment = (appt: MedicalAppointment) => {
    setEditingAppointment(appt);
    setTargetSlotForNew(appt.timeSlot);
    setAppointmentModalVisible(true);
  };

  // Open status modal
  const handleManageStatus = (appt: MedicalAppointment) => {
    setActiveAppointmentForStatus(appt);
    setStatusModalVisible(true);
  };

  // Open reprogram modal
  const handleOpenReprogram = (appt: MedicalAppointment) => {
    setActiveAppointmentForReprogram(appt);
    setReprogramModalVisible(true);
  };

  const bgScreen = isDark ? '#121316' : '#F8FAFC';
  const textColor = isDark ? '#F9FAFB' : '#0F172A';
  const textSecondary = isDark ? '#9CA3AF' : '#64748B';
  const cardBg = isDark ? '#1C1E23' : '#FFFFFF';
  const borderColor = isDark ? '#2D3139' : '#E2E8F0';

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: bgScreen }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Cargando agenda médica...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgScreen }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: BottomTabInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Top Bar Header */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.appTitle, { color: textColor }]}>Agenda de Citas</Text>
              <Text style={[styles.dateSubtitle, { color: textSecondary }]}>
                {formattedSelectedDate}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAddNewGeneral}
              style={styles.headerAddBtn}
              activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.headerAddBtnText}>Nueva Cita</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.statNum, { color: textColor }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>Citas</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.statNum, { color: '#059669' }]}>{stats.confirmada}</Text>
              <Text style={[styles.statLabel, { color: '#059669' }]}>Confirmadas</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.statNum, { color: '#D97706' }]}>{stats.pendiente}</Text>
              <Text style={[styles.statLabel, { color: '#D97706' }]}>Pendientes</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.statNum, { color: '#7C3AED' }]}>{stats.reprogramada}</Text>
              <Text style={[styles.statLabel, { color: '#7C3AED' }]}>Reprogram.</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.statNum, { color: '#DC2626' }]}>{stats.cancelada}</Text>
              <Text style={[styles.statLabel, { color: '#DC2626' }]}>Canceladas</Text>
            </View>
          </View>

          {/* Interactive Calendar Strip */}
          <CalendarStrip />

          {/* Status Filter Chips */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Franjas de Horario</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setActiveFilter('todas')}
                style={[
                  styles.filterChip,
                  activeFilter === 'todas' && styles.filterChipActive,
                  { backgroundColor: activeFilter === 'todas' ? '#2563EB' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'todas' ? '#FFFFFF' : textColor },
                  ]}>
                  Todas ({allSlots.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('confirmada')}
                style={[
                  styles.filterChip,
                  activeFilter === 'confirmada' && { backgroundColor: '#10B981', borderColor: '#059669' },
                  { backgroundColor: activeFilter === 'confirmada' ? '#10B981' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'confirmada' ? '#FFFFFF' : '#059669' },
                  ]}>
                  Confirmadas ({stats.confirmada})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('pendiente')}
                style={[
                  styles.filterChip,
                  activeFilter === 'pendiente' && { backgroundColor: '#F59E0B', borderColor: '#D97706' },
                  { backgroundColor: activeFilter === 'pendiente' ? '#F59E0B' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'pendiente' ? '#FFFFFF' : '#D97706' },
                  ]}>
                  Pendientes ({stats.pendiente})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('reprogramada')}
                style={[
                  styles.filterChip,
                  activeFilter === 'reprogramada' && { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' },
                  { backgroundColor: activeFilter === 'reprogramada' ? '#8B5CF6' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'reprogramada' ? '#FFFFFF' : '#7C3AED' },
                  ]}>
                  Reprogramadas ({stats.reprogramada})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('cancelada')}
                style={[
                  styles.filterChip,
                  activeFilter === 'cancelada' && { backgroundColor: '#EF4444', borderColor: '#DC2626' },
                  { backgroundColor: activeFilter === 'cancelada' ? '#EF4444' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'cancelada' ? '#FFFFFF' : '#DC2626' },
                  ]}>
                  Canceladas ({stats.cancelada})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('libres')}
                style={[
                  styles.filterChip,
                  activeFilter === 'libres' && styles.filterChipActive,
                  { backgroundColor: activeFilter === 'libres' ? '#2563EB' : cardBg, borderColor },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: activeFilter === 'libres' ? '#FFFFFF' : textColor },
                  ]}>
                  Libres
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Time Slots List */}
          <View style={styles.slotsList}>
            {filteredSlots.length === 0 ? (
              <View style={[styles.emptyFilterBox, { backgroundColor: cardBg, borderColor }]}>
                <Ionicons name="filter-outline" size={32} color={textSecondary} />
                <Text style={[styles.emptyFilterText, { color: textSecondary }]}>
                  No hay franjas con el filtro seleccionado para este día.
                </Text>
              </View>
            ) : (
              filteredSlots.map((slot) => (
                <TimeSlotItem
                  key={slot.id}
                  slot={slot}
                  onAddPress={handleAddInSlot}
                  onManageStatus={handleManageStatus}
                  onReprogram={handleOpenReprogram}
                  onEdit={handleEditAppointment}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AppointmentModal
        visible={appointmentModalVisible}
        onClose={() => setAppointmentModalVisible(false)}
        initialDate={selectedDate}
        initialTimeSlot={targetSlotForNew}
        appointmentToEdit={editingAppointment}
      />

      <StatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        appointment={activeAppointmentForStatus}
        onOpenReprogram={() => {
          if (activeAppointmentForStatus) {
            handleOpenReprogram(activeAppointmentForStatus);
          }
        }}
        onOpenEdit={() => {
          if (activeAppointmentForStatus) {
            handleEditAppointment(activeAppointmentForStatus);
          }
        }}
      />

      <ReprogramModal
        visible={reprogramModalVisible}
        onClose={() => setReprogramModalVisible(false)}
        appointment={activeAppointmentForReprogram}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slotsList: {
    marginTop: 4,
  },
  emptyFilterBox: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyFilterText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
