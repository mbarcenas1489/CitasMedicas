import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentStatus, STATUS_CONFIG } from '@/types/appointment';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendiente;

  const getIconName = () => {
    switch (status) {
      case 'confirmada':
        return 'checkmark-circle-outline';
      case 'pendiente':
        return 'time-outline';
      case 'cancelada':
        return 'close-circle-outline';
      case 'reprogramada':
        return 'refresh-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingVertical: isSmall ? 2 : isLarge ? 6 : 4,
          paddingHorizontal: isSmall ? 6 : isLarge ? 12 : 8,
        },
      ]}>
      {showIcon && (
        <Ionicons
          name={getIconName()}
          size={isSmall ? 12 : isLarge ? 16 : 14}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: isSmall ? 11 : isLarge ? 14 : 12,
            fontWeight: '600',
          },
        ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    textTransform: 'capitalize',
  },
});

