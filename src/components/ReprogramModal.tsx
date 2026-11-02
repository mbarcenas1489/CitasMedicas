import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicalAppointment, DEFAULT_TIME_SLOTS } from '@/types/appointment';
import { useAppointments } from '@/context/AppointmentsContext';

interface ReprogramModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: MedicalAppointment | null;
}

const COMMON_REASONS = [
  'Solicitud del paciente',
  'Médico no disponible',
  'Cruce de horarios',
  'Fuerza mayor / Emergencia',
];

export const ReprogramModal: React.FC<ReprogramModalProps> = ({
  visible,
  onClose,
  appointment,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { reprogramAppointment, appointments } = useAppointments();

  // Helper to format date
  const getFormatDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 7 upcoming available dates to choose from
  const upcomingDates = useMemo(() => {
    const dates = [];
    const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = getFormatDate(i);
      dates.push({
        dateStr,
        dayName: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DAYS_ES[d.getDay()],
        dayNum: d.getDate(),
      });
    }
    return dates;
  }, []);

  const [selectedNewDate, setSelectedNewDate] = useState<string>(upcomingDates[1]?.dateStr || getFormatDate(1));
  const [selectedSlot, setSelectedSlot] = useState<string>(DEFAULT_TIME_SLOTS[0]);
  const [reason, setReason] = useState<string>('Solicitud del paciente');

  if (!appointment) return null;

  // Occupied slots for the newly selected date
  const occupiedSlotsOnDate = appointments
    .filter((a) => a.date === selectedNewDate && a.id !== appointment.id && a.status !== 'cancelada')
    .map((a) => a.timeSlot);

  const handleReprogram = async () => {
    if (occupiedSlotsOnDate.includes(selectedSlot)) {
      Alert.alert(
        'Franja Ocupada',
        'Ya existe una cita programada en esta franja horaria. Elige otra franja o cancela la anterior.'
      );
      return;
    }

    try {
      await reprogramAppointment(
        appointment.id,
        selectedNewDate,
        selectedSlot,
        reason.trim() || 'Reprogramada'
      );
      Alert.alert(
        'Cita Reprogramada',
        `La cita de ${appointment.patientName} ha sido cambiada para el ${selectedNewDate} de ${selectedSlot}.`
      );
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo reprogramar la cita.');
    }
  };

  const bgModal = isDark ? '#1C1D21' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#26282E' : '#F3F4F6';
  const borderColor = isDark ? '#373A42' : '#E5E7EB';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: bgModal }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>Reprogramar Cita</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Paciente: {appointment.patientName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Current schedule info */}
            <View style={[styles.infoBox, { backgroundColor: isDark ? '#2B2438' : '#F5F3FF', borderColor: '#C4B5FD' }]}>
              <Ionicons name="time-outline" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '600' }}>
                Horario actual: {appointment.date} ({appointment.timeSlot})
              </Text>
            </View>

            {/* Step 1: Choose new date */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>1. Selecciona la Nueva Fecha</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesRow}>
              {upcomingDates.map((item) => {
                const isSelected = item.dateStr === selectedNewDate;
                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    onPress={() => setSelectedNewDate(item.dateStr)}
                    style={[
                      styles.dateCard,
                      {
                        backgroundColor: isSelected ? '#7C3AED' : inputBg,
                        borderColor: isSelected ? '#6D28D9' : borderColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dateCardDay,
                        { color: isSelected ? '#EDE9FE' : textSecondary },
                      ]}>
                      {item.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dateCardNum,
                        { color: isSelected ? '#FFFFFF' : textColor },
                      ]}>
                      {item.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Choose available slot */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              2. Selecciona Nueva Franja Horaria
            </Text>
            <View style={styles.slotsGrid}>
              {DEFAULT_TIME_SLOTS.map((slot) => {
                const isOccupied = occupiedSlotsOnDate.includes(slot);
                const isSelected = selectedSlot === slot && !isOccupied;

                return (
                  <TouchableOpacity
                    key={slot}
                    disabled={isOccupied}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.slotPill,
                      {
                        backgroundColor: isSelected
                          ? '#7C3AED'
                          : isOccupied
                          ? isDark
                            ? '#2A2020'
                            : '#FEE2E2'
                          : inputBg,
                        borderColor: isSelected
                          ? '#6D28D9'
                          : isOccupied
                          ? '#FCA5A5'
                          : borderColor,
                        opacity: isOccupied ? 0.6 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.slotText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isOccupied
                            ? '#DC2626'
                            : textColor,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {slot} {isOccupied ? '(Ocupada)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 3: Reason */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>3. Motivo del Cambio</Text>
            <View style={styles.reasonsList}>
              {COMMON_REASONS.map((r) => {
                const isSelected = reason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    style={[
                      styles.reasonChip,
                      {
                        backgroundColor: isSelected ? '#EDE9FE' : inputBg,
                        borderColor: isSelected ? '#7C3AED' : borderColor,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.reasonChipText,
                        { color: isSelected ? '#7C3AED' : textColor, fontWeight: isSelected ? '700' : '500' },
                      ]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[
                styles.customReasonInput,
                { backgroundColor: inputBg, borderColor, color: textColor },
              ]}
              placeholder="O escribe un motivo personalizado..."
              placeholderTextColor={textSecondary}
              value={reason}
              onChangeText={setReason}
            />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <TouchableOpacity onPress={onClose} style={[styles.btnCancel, { backgroundColor: inputBg }]}>
              <Text style={[styles.btnCancelText, { color: textColor }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleReprogram} style={styles.btnConfirm}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnConfirmText}>Confirmar Reprogramación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  dateCard: {
    width: 60,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  dateCardDay: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateCardNum: {
    fontSize: 17,
    fontWeight: '700',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotText: {
    fontSize: 12,
  },
  reasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  reasonChipText: {
    fontSize: 12,
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 2,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

