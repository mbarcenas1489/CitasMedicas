import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppointments } from '@/context/AppointmentsContext';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusModal } from '@/components/StatusModal';
import { ReprogramModal } from '@/components/ReprogramModal';
import { AppointmentModal } from '@/components/AppointmentModal';
import { MedicalAppointment, AppointmentStatus } from '@/types/appointment';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';

type StatusFilter = 'todas' | AppointmentStatus;

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const { appointments, resetToSampleData } = useAppointments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('todas');

  // Modals state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [activeAppointmentForStatus, setActiveAppointmentForStatus] =
    useState<MedicalAppointment | null>(null);

  const [reprogramModalVisible, setReprogramModalVisible] = useState(false);
  const [activeAppointmentForReprogram, setActiveAppointmentForReprogram] =
    useState<MedicalAppointment | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<MedicalAppointment | null>(null);

  // Global KPIs
  const metrics = useMemo(() => {
    const total = appointments.length;
    let confirmadas = 0;
    let pendientes = 0;
    let reprogramadas = 0;
    let canceladas = 0;

    for (const a of appointments) {
      if (a.status === 'confirmada') confirmadas++;
      else if (a.status === 'pendiente') pendientes++;
      else if (a.status === 'reprogramada') reprogramadas++;
      else if (a.status === 'cancelada') canceladas++;
    }

    const confirmedRate = total > 0 ? Math.round((confirmadas / total) * 100) : 0;

    return { total, confirmadas, pendientes, reprogramadas, canceladas, confirmedRate };
  }, [appointments]);

  // Filtered & sorted appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        // Status filter
        if (selectedStatus !== 'todas' && appt.status !== selectedStatus) {
          return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const patientMatch = appt.patientName.toLowerCase().includes(q);
        const phoneMatch = appt.patientPhone?.toLowerCase().includes(q) ?? false;
        const dateMatch = appt.date.includes(q);
        const reasonMatch = appt.reason?.toLowerCase().includes(q) ?? false;

        return patientMatch || phoneMatch || dateMatch || reasonMatch;
      })
      .sort((a, b) => {
        // Sort by date ascending, then time slot
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.timeSlot.localeCompare(b.timeSlot);
      });
  }, [appointments, selectedStatus, searchQuery]);

  const handleResetData = () => {
    Alert.alert(
      'Restablecer Datos de Demostración',
      '¿Deseas restaurar las citas médicas de prueba para probar todos los estados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'default',
          onPress: async () => {
            await resetToSampleData();
          },
        },
      ]
    );
  };

  const bgScreen = isDark ? '#121316' : '#F8FAFC';
  const textColor = isDark ? '#F9FAFB' : '#0F172A';
  const textSecondary = isDark ? '#9CA3AF' : '#64748B';
  const cardBg = isDark ? '#1C1E23' : '#FFFFFF';
  const borderColor = isDark ? '#2D3139' : '#E2E8F0';
  const inputBg = isDark ? '#22252C' : '#FFFFFF';

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
          {/* Header */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>Historial y Búsqueda</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                {metrics.total} citas registradas en total
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleResetData}
              style={[styles.resetBtn, { backgroundColor: cardBg, borderColor }]}>
              <Ionicons name="reload-outline" size={16} color="#2563EB" />
              <Text style={styles.resetBtnText}>Datos Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Metric KPI Cards */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricHeader}>
                <Ionicons name="calendar" size={16} color="#2563EB" />
                <Text style={[styles.metricLabel, { color: textSecondary }]}>Total</Text>
              </View>
              <Text style={[styles.metricNumber, { color: textColor }]}>{metrics.total}</Text>
              <Text style={[styles.metricSub, { color: '#059669' }]}>
                {metrics.confirmedRate}% efectividad
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricHeader}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={[styles.metricLabel, { color: textSecondary }]}>Confirmadas</Text>
              </View>
              <Text style={[styles.metricNumber, { color: '#059669' }]}>{metrics.confirmadas}</Text>
              <Text style={[styles.metricSub, { color: textSecondary }]}>Asistencias</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricHeader}>
                <Ionicons name="refresh-circle" size={16} color="#7C3AED" />
                <Text style={[styles.metricLabel, { color: textSecondary }]}>Reprogram.</Text>
              </View>
              <Text style={[styles.metricNumber, { color: '#7C3AED' }]}>{metrics.reprogramadas}</Text>
              <Text style={[styles.metricSub, { color: textSecondary }]}>Cambio horario</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.metricHeader}>
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={[styles.metricLabel, { color: textSecondary }]}>Canceladas</Text>
              </View>
              <Text style={[styles.metricNumber, { color: '#DC2626' }]}>{metrics.canceladas}</Text>
              <Text style={[styles.metricSub, { color: textSecondary }]}>Anuladas</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
            <Ionicons name="search" size={18} color={textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Buscar por paciente, médico, especialidad o fecha..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['todas', 'confirmada', 'pendiente', 'reprogramada', 'cancelada'] as StatusFilter[]).map(
              (st) => {
                const isSelected = selectedStatus === st;
                const labels: Record<StatusFilter, string> = {
                  todas: `Todas (${metrics.total})`,
                  confirmada: `Confirmadas (${metrics.confirmadas})`,
                  pendiente: `Pendientes (${metrics.pendientes})`,
                  reprogramada: `Reprogramadas (${metrics.reprogramadas})`,
                  cancelada: `Canceladas (${metrics.canceladas})`,
                };

                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setSelectedStatus(st)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                      {
                        backgroundColor: isSelected ? '#2563EB' : cardBg,
                        borderColor: isSelected ? '#1D4ED8' : borderColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? '#FFFFFF' : textColor },
                      ]}>
                      {labels[st]}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          {/* List of Appointments */}
          <View style={styles.appointmentsList}>
            {filteredAppointments.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor }]}>
                <Ionicons name="search-outline" size={36} color={textSecondary} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  No se encontraron citas
                </Text>
                <Text style={[styles.emptySub, { color: textSecondary }]}>
                  Prueba cambiando la búsqueda o el filtro de estado seleccionado.
                </Text>
              </View>
            ) : (
              filteredAppointments.map((appt) => (
                <View
                  key={appt.id}
                  style={[styles.appointmentCard, { backgroundColor: cardBg, borderColor }]}>
                  {/* Top Bar of card: Date, Slot & Status */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.dateBadgeText}>{appt.date}</Text>
                      <Text style={styles.dateBadgeDot}>•</Text>
                      <Text style={styles.dateBadgeText}>{appt.timeSlot}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setActiveAppointmentForStatus(appt);
                        setStatusModalVisible(true);
                      }}>
                      <StatusBadge status={appt.status} size="small" />
                    </TouchableOpacity>
                  </View>

                  {/* Patient Info */}
                  <View style={styles.patientSection}>
                    <Text style={[styles.patientName, { color: textColor }]}>
                      {appt.patientName}
                    </Text>
                    {appt.patientPhone ? (
                      <View style={styles.phoneRow}>
                        <Ionicons name="call-outline" size={13} color={textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.phoneText, { color: textSecondary }]}>
                          {appt.patientPhone}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Reason if available */}
                  {appt.reason ? (
                    <Text style={[styles.reasonText, { color: textSecondary }]}>
                      Nota: {appt.reason}
                    </Text>
                  ) : null}

                  {/* Reprogrammed details banner */}
                  {appt.status === 'reprogramada' && appt.reprogrammedInfo && (
                    <View style={[styles.reprogInfo, { backgroundColor: isDark ? '#2E223E' : '#F5F3FF' }]}>
                      <Ionicons name="refresh" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={styles.reprogInfoText}>
                        Reprogramada desde: {appt.reprogrammedInfo.originalDate} ({appt.reprogrammedInfo.originalTimeSlot})
                        {appt.reprogrammedInfo.reason ? ` • ${appt.reprogrammedInfo.reason}` : ''}
                      </Text>
                    </View>
                  )}

                  {/* Cancellation reason banner */}
                  {appt.status === 'cancelada' && appt.cancellationReason && (
                    <View style={[styles.cancelInfo, { backgroundColor: isDark ? '#382222' : '#FEE2E2' }]}>
                      <Ionicons name="alert-circle" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.cancelInfoText}>
                        Cancelada: {appt.cancellationReason}
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={[styles.cardActionRow, { borderTopColor: borderColor }]}>
                    <TouchableOpacity
                      onPress={() => {
                        setActiveAppointmentForStatus(appt);
                        setStatusModalVisible(true);
                      }}
                      style={[styles.smallBtn, { backgroundColor: isDark ? '#272A30' : '#F1F5F9' }]}>
                      <Ionicons name="swap-horizontal" size={13} color={textColor} style={{ marginRight: 4 }} />
                      <Text style={[styles.smallBtnText, { color: textColor }]}>Cambiar Estado</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setActiveAppointmentForReprogram(appt);
                        setReprogramModalVisible(true);
                      }}
                      style={[styles.smallBtn, { backgroundColor: isDark ? '#272A30' : '#F1F5F9' }]}>
                      <Ionicons name="calendar-outline" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                      <Text style={[styles.smallBtnText, { color: '#7C3AED' }]}>Reprogramar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setEditingAppointment(appt);
                        setEditModalVisible(true);
                      }}
                      style={[styles.smallBtn, { backgroundColor: isDark ? '#272A30' : '#F1F5F9' }]}>
                      <Ionicons name="pencil-outline" size={13} color={textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.smallBtnText, { color: textSecondary }]}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <StatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        appointment={activeAppointmentForStatus}
        onOpenReprogram={() => {
          if (activeAppointmentForStatus) {
            setActiveAppointmentForReprogram(activeAppointmentForStatus);
            setReprogramModalVisible(true);
          }
        }}
        onOpenEdit={() => {
          if (activeAppointmentForStatus) {
            setEditingAppointment(activeAppointmentForStatus);
            setEditModalVisible(true);
          }
        }}
      />

      <ReprogramModal
        visible={reprogramModalVisible}
        onClose={() => setReprogramModalVisible(false)}
        appointment={activeAppointmentForReprogram}
      />

      <AppointmentModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        appointmentToEdit={editingAppointment}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  resetBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
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
  appointmentsList: {
    gap: 12,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  appointmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateBadgeText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  dateBadgeDot: {
    color: '#93C5FD',
    marginHorizontal: 4,
  },
  patientSection: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 8,
  },
  doctorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  specialtyPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialtyPillText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  reprogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reprogInfoText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cancelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelInfoText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
