import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyTimeSlot, MedicalAppointment } from '@/types/appointment';
import { StatusBadge } from './StatusBadge';

interface TimeSlotItemProps {
  slot: DailyTimeSlot;
  onAddPress: (slotLabel: string) => void;
  onManageStatus: (appointment: MedicalAppointment) => void;
  onReprogram: (appointment: MedicalAppointment) => void;
  onEdit: (appointment: MedicalAppointment) => void;
}

export const TimeSlotItem: React.FC<TimeSlotItemProps> = ({
  slot,
  onAddPress,
  onManageStatus,
  onReprogram,
  onEdit,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const appointment = slot.appointment;

  const cardBg = isDark ? '#1C1E23' : '#FFFFFF';
  const borderColor = isDark ? '#2B2F38' : '#E2E8F0';
  const textColor = isDark ? '#F9FAFB' : '#0F172A';
  const textSecondary = isDark ? '#9CA3AF' : '#64748B';

  if (!appointment) {
    // Empty Slot Card: Clean, minimal and inviting
    return (
      <View style={[styles.emptyContainer, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.emptyTimeCol}>
          <Ionicons name="time-outline" size={15} color={textSecondary} />
          <Text style={[styles.emptyTimeText, { color: textColor }]}>{slot.label}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onAddPress(slot.label)}
          style={styles.emptyAddBtn}
          activeOpacity={0.7}>
          <Ionicons name="add" size={15} color="#2563EB" style={{ marginRight: 4 }} />
          <Text style={styles.emptyAddText}>Agendar Cita</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Occupied Slot Card: Clean, focused directly on patient and status
  return (
    <View style={[styles.cardContainer, { backgroundColor: cardBg, borderColor }]}>
      {/* Header: Slot time and Status Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.timeTag}>
          <Ionicons name="time" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
          <Text style={styles.timeTagText}>{appointment.timeSlot}</Text>
        </View>

        <TouchableOpacity onPress={() => onManageStatus(appointment)} activeOpacity={0.7}>
          <StatusBadge status={appointment.status} size="small" />
        </TouchableOpacity>
      </View>

      {/* Patient Information */}
      <View style={styles.patientRow}>
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#262A33' : '#EFF6FF' }]}>
          <Ionicons name="person" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.patientName, { color: textColor }]}>{appointment.patientName}</Text>
          {appointment.patientPhone ? (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={12} color={textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.phoneText, { color: textSecondary }]}>
                {appointment.patientPhone}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Reason / Consultation notes */}
      {appointment.reason ? (
        <View style={styles.notesRow}>
          <Ionicons name="document-text-outline" size={13} color={textSecondary} style={{ marginRight: 6, marginTop: 1 }} />
          <Text style={[styles.notesText, { color: textSecondary }]}>{appointment.reason}</Text>
        </View>
      ) : null}

      {/* Reprogrammed Banner */}
      {appointment.status === 'reprogramada' && appointment.reprogrammedInfo && (
        <View style={[styles.reprogrammedBanner, { backgroundColor: isDark ? '#2A2038' : '#F5F3FF' }]}>
          <Ionicons name="refresh" size={13} color="#7C3AED" style={{ marginRight: 6 }} />
          <Text style={styles.reprogrammedText}>
            Antes: {appointment.reprogrammedInfo.originalDate} ({appointment.reprogrammedInfo.originalTimeSlot})
            {appointment.reprogrammedInfo.reason ? ` • ${appointment.reprogrammedInfo.reason}` : ''}
          </Text>
        </View>
      )}

      {/* Cancellation Banner */}
      {appointment.status === 'cancelada' && appointment.cancellationReason && (
        <View style={[styles.cancelledBanner, { backgroundColor: isDark ? '#351F1F' : '#FEE2E2' }]}>
          <Ionicons name="alert-circle" size={13} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.cancelledText}>
            Cancelada: {appointment.cancellationReason}
          </Text>
        </View>
      )}

      {/* Card Action Buttons */}
      <View style={[styles.actionRow, { borderTopColor: borderColor }]}>
        <TouchableOpacity
          onPress={() => onManageStatus(appointment)}
          style={[styles.actionBtn, { backgroundColor: isDark ? '#262931' : '#F1F5F9' }]}>
          <Ionicons name="swap-horizontal" size={13} color={textColor} style={{ marginRight: 4 }} />
          <Text style={[styles.actionBtnText, { color: textColor }]}>Estado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onReprogram(appointment)}
          style={[styles.actionBtn, { backgroundColor: isDark ? '#262931' : '#F1F5F9' }]}>
          <Ionicons name="calendar-outline" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
          <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Reprogramar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onEdit(appointment)}
          style={[styles.actionBtn, { backgroundColor: isDark ? '#262931' : '#F1F5F9' }]}>
          <Ionicons name="pencil-outline" size={13} color={textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.actionBtnText, { color: textSecondary }]}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  emptyTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  emptyAddText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeTagText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  patientName: {
    fontSize: 15,
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
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  notesText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 15,
  },
  reprogrammedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  reprogrammedText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  cancelledText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
