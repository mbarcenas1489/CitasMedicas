import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import {
  MedicalAppointment,
  AppointmentStatus,
  DEFAULT_TIME_SLOTS,
} from '@/types/appointment';
import { useAppointments } from '@/context/AppointmentsContext';

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  initialTimeSlot?: string;
  initialDate?: string;
  appointmentToEdit?: MedicalAppointment | null;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  visible,
  onClose,
  initialTimeSlot,
  initialDate,
  appointmentToEdit,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { addAppointment, updateAppointment, selectedDate } = useAppointments();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot || DEFAULT_TIME_SLOTS[0]);
  const [date, setDate] = useState(initialDate || selectedDate);
  const [status, setStatus] = useState<AppointmentStatus>('confirmada');
  const [reason, setReason] = useState('');
  const [showAllSlots, setShowAllSlots] = useState(false);

  useEffect(() => {
    if (appointmentToEdit) {
      setPatientName(appointmentToEdit.patientName);
      setPatientPhone(appointmentToEdit.patientPhone || '');
      setTimeSlot(appointmentToEdit.timeSlot);
      setDate(appointmentToEdit.date);
      setStatus(appointmentToEdit.status);
      setReason(appointmentToEdit.reason || '');
      setShowAllSlots(false);
    } else {
      setPatientName('');
      setPatientPhone('');
      const slotToUse = initialTimeSlot || DEFAULT_TIME_SLOTS[0];
      setTimeSlot(slotToUse);
      setDate(initialDate || selectedDate);
      setStatus('confirmada');
      setReason('');
      setShowAllSlots(false);
    }
  }, [appointmentToEdit, initialTimeSlot, initialDate, selectedDate, visible]);

  // Import from device contacts
  const handlePickFromContacts = async () => {
    try {
      const { status: permStatus } = await Contacts.requestPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Por favor concede permiso a tus contactos para autocompletar el nombre y teléfono del paciente.'
        );
        return;
      }

      if (Contacts.presentContactPickerAsync) {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) {
          if (contact.name) {
            setPatientName(contact.name);
          }
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            // Clean phone string
            const rawPhone = contact.phoneNumbers[0].number || '';
            setPatientPhone(rawPhone);
          }
        }
      } else {
        Alert.alert('Info', 'El selector nativo de contactos no está disponible en este dispositivo.');
      }
    } catch (error) {
      console.warn('Error al leer contactos:', error);
      Alert.alert('Aviso', 'No se pudo abrir el selector de contactos.');
    }
  };

  const handleSave = async () => {
    if (!patientName.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa o selecciona el nombre del paciente.');
      return;
    }

    try {
      if (appointmentToEdit) {
        await updateAppointment(appointmentToEdit.id, {
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          timeSlot,
          date,
          status,
          reason: reason.trim(),
        });
      } else {
        await addAppointment({
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          timeSlot,
          date,
          status,
          reason: reason.trim(),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la cita médica.');
    }
  };

  const bgModal = isDark ? '#1C1D21' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#26282E' : '#F8FAFC';
  const inputBorder = isDark ? '#373A42' : '#E2E8F0';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: bgModal }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>
                {appointmentToEdit ? 'Editar Cita' : 'Nueva Cita'}
              </Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Fecha: {date}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            
            {/* Franja Horaria Seleccionada destacada */}
            <View style={styles.selectedSlotBox}>
              <View style={styles.selectedSlotLeft}>
                <Ionicons name="time" size={18} color="#2563EB" />
                <View>
                  <Text style={styles.selectedSlotLabel}>Franja Horaria:</Text>
                  <Text style={styles.selectedSlotValue}>{timeSlot}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowAllSlots(!showAllSlots)}
                style={styles.changeSlotBtn}>
                <Text style={styles.changeSlotBtnText}>
                  {showAllSlots ? 'Ocultar' : 'Cambiar'}
                </Text>
                <Ionicons
                  name={showAllSlots ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#2563EB"
                />
              </TouchableOpacity>
            </View>

            {/* Selector de franja desplegable si se desea cambiar */}
            {showAllSlots && (
              <View style={styles.slotsDropdown}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {DEFAULT_TIME_SLOTS.map((slot) => {
                    const isSelected = slot === timeSlot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => {
                          setTimeSlot(slot);
                          setShowAllSlots(false);
                        }}
                        style={[
                          styles.slotChip,
                          {
                            backgroundColor: isSelected ? '#2563EB' : inputBg,
                            borderColor: isSelected ? '#1D4ED8' : inputBorder,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.slotChipText,
                            {
                              color: isSelected ? '#FFFFFF' : textColor,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Datos del Paciente + Botón para importar de Contactos */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: textColor }]}>Paciente *</Text>
              <TouchableOpacity
                onPress={handlePickFromContacts}
                style={styles.contactsBtn}
                activeOpacity={0.7}>
                <Ionicons name="people-outline" size={14} color="#2563EB" />
                <Text style={styles.contactsBtnText}>Elegir de Contactos</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="Nombre completo del paciente"
              placeholderTextColor={textSecondary}
              value={patientName}
              onChangeText={setPatientName}
            />

            {/* Teléfono de Contacto */}
            <Text style={[styles.label, { color: textColor, marginTop: 12 }]}>
              Teléfono (opcional)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="Número de teléfono o celular"
              placeholderTextColor={textSecondary}
              keyboardType="phone-pad"
              value={patientPhone}
              onChangeText={setPatientPhone}
            />

            {/* Estado Inicial */}
            <Text style={[styles.label, { color: textColor, marginTop: 12 }]}>
              Estado Inicial
            </Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                onPress={() => setStatus('confirmada')}
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: status === 'confirmada' ? '#10B981' : inputBg,
                    borderColor: status === 'confirmada' ? 'transparent' : inputBorder,
                  },
                ]}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={status === 'confirmada' ? '#FFFFFF' : textSecondary}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: status === 'confirmada' ? '#FFFFFF' : textColor,
                      fontWeight: status === 'confirmada' ? '700' : '500',
                    },
                  ]}>
                  Confirmada
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatus('pendiente')}
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: status === 'pendiente' ? '#F59E0B' : inputBg,
                    borderColor: status === 'pendiente' ? 'transparent' : inputBorder,
                  },
                ]}>
                <Ionicons
                  name="time"
                  size={16}
                  color={status === 'pendiente' ? '#FFFFFF' : textSecondary}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: status === 'pendiente' ? '#FFFFFF' : textColor,
                      fontWeight: status === 'pendiente' ? '700' : '500',
                    },
                  ]}>
                  Pendiente
                </Text>
              </TouchableOpacity>
            </View>

            {/* Motivo de la Cita */}
            <Text style={[styles.label, { color: textColor, marginTop: 12 }]}>
              Motivo o Notas (opcional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="Ej: Control general, lectura de exámenes, revisión..."
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={2}
              value={reason}
              onChangeText={setReason}
            />
          </ScrollView>

          {/* Modal Actions */}
          <View style={[styles.footer, { borderTopColor: inputBorder }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btnCancel, { backgroundColor: inputBg }]}>
              <Text style={[styles.btnCancelText, { color: textColor }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={styles.btnSave}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnSaveText}>
                {appointmentToEdit ? 'Guardar Cambios' : 'Agendar Cita'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  selectedSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedSlotLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
  },
  selectedSlotValue: {
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  changeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  changeSlotBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  slotsDropdown: {
    marginBottom: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  slotChipText: {
    fontSize: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactsBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  statusPillText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnSave: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
