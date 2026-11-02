import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicalAppointment, AppointmentStatus } from '@/types/appointment';
import { useAppointments } from '@/context/AppointmentsContext';
import { StatusBadge } from './StatusBadge';

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: MedicalAppointment | null;
  onOpenReprogram: () => void;
  onOpenEdit: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  onClose,
  appointment,
  onOpenReprogram,
  onOpenEdit,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { updateStatus, deleteAppointment } = useAppointments();

  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!appointment) return null;

  const handleSetStatus = async (status: AppointmentStatus) => {
    if (status === 'cancelada' && !showCancelInput) {
      setShowCancelInput(true);
      return;
    }

    try {
      await updateStatus(appointment.id, status, status === 'cancelada' ? cancelReason : undefined);
      setShowCancelInput(false);
      setCancelReason('');
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cita',
      `¿Estás seguro de que deseas eliminar permanentemente la cita de ${appointment.patientName}?`,
      [
        { text: 'No, conservar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteAppointment(appointment.id);
            onClose();
          },
        },
      ]
    );
  };

  const bgModal = isDark ? '#1C1D21' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#26282E' : '#F3F4F6';
  const borderColor = isDark ? '#373A42' : '#E5E7EB';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: bgModal }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: textColor }]}>Gestionar Estado de Cita</Text>
              <Text style={[styles.patientName, { color: textSecondary }]}>
                {appointment.patientName} • {appointment.timeSlot}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowCancelInput(false);
                onClose();
              }}
              style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Current Status Preview */}
          <View style={[styles.currentStatusRow, { backgroundColor: inputBg, borderColor }]}>
            <Text style={[styles.statusLabel, { color: textSecondary }]}>Estado Actual:</Text>
            <StatusBadge status={appointment.status} size="medium" />
          </View>

          {/* Cancellation reason input view */}
          {showCancelInput ? (
            <View style={styles.cancelSection}>
              <Text style={[styles.cancelTitle, { color: '#DC2626' }]}>
                Motivo de la Cancelación:
              </Text>
              <TextInput
                style={[
                  styles.cancelInput,
                  { backgroundColor: inputBg, borderColor, color: textColor },
                ]}
                placeholder="Ej: Paciente canceló por viaje / Imprevisto médico..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                value={cancelReason}
                onChangeText={setCancelReason}
              />
              <View style={styles.cancelBtnsRow}>
                <TouchableOpacity
                  onPress={() => setShowCancelInput(false)}
                  style={[styles.actionBtnSecondary, { backgroundColor: inputBg }]}>
                  <Text style={[styles.actionBtnText, { color: textColor }]}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSetStatus('cancelada')}
                  style={[styles.actionBtnCancelSubmit]}>
                  <Text style={styles.actionBtnTextWhite}>Confirmar Cancelación</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.optionsList}>
              {/* Option: Confirmar */}
              {appointment.status !== 'confirmada' && (
                <TouchableOpacity
                  onPress={() => handleSetStatus('confirmada')}
                  style={[styles.statusOption, { borderColor }]}>
                  <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="checkmark-circle" size={22} color="#059669" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: '#059669' }]}>Confirmar Cita</Text>
                    <Text style={[styles.optionDesc, { color: textSecondary }]}>
                      El paciente o clínica confirmó su asistencia
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Option: Pendiente */}
              {appointment.status !== 'pendiente' && (
                <TouchableOpacity
                  onPress={() => handleSetStatus('pendiente')}
                  style={[styles.statusOption, { borderColor }]}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time" size={22} color="#D97706" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: '#D97706' }]}>Marcar como Pendiente</Text>
                    <Text style={[styles.optionDesc, { color: textSecondary }]}>
                      A la espera de confirmación de hora o datos
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Option: Reprogramar */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenReprogram();
                }}
                style={[styles.statusOption, { borderColor }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="calendar" size={22} color="#7C3AED" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: '#7C3AED' }]}>Reprogramar Cita</Text>
                  <Text style={[styles.optionDesc, { color: textSecondary }]}>
                    Cambiar a otra fecha o franja horaria disponible
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option: Cancelar */}
              {appointment.status !== 'cancelada' && (
                <TouchableOpacity
                  onPress={() => setShowCancelInput(true)}
                  style={[styles.statusOption, { borderColor }]}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="close-circle" size={22} color="#DC2626" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: '#DC2626' }]}>Cancelar Cita</Text>
                    <Text style={[styles.optionDesc, { color: textSecondary }]}>
                      Anular la consulta especificando el motivo
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Quick actions: Edit or Delete */}
              <View style={[styles.bottomActions, { borderTopColor: borderColor }]}>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenEdit();
                  }}
                  style={[styles.editBtn, { backgroundColor: inputBg }]}>
                  <Ionicons name="pencil" size={16} color={textColor} style={{ marginRight: 6 }} />
                  <Text style={[styles.bottomBtnText, { color: textColor }]}>Editar Datos</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={[styles.bottomBtnText, { color: '#DC2626' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 14,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionsList: {
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelSection: {
    marginTop: 6,
    gap: 10,
  },
  cancelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancelBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnCancelSubmit: {
    flex: 2,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

