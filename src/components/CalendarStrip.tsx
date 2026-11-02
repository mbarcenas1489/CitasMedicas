import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppointments } from '@/context/AppointmentsContext';
import { STATUS_CONFIG } from '@/types/appointment';

const DAYS_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_NAMES_ES = [
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

export const CalendarStrip: React.FC = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { selectedDate, setSelectedDate, datesWithAppointments } = useAppointments();

  // Date anchor for current browsing view (Month/Year)
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const parts = selectedDate.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  });

  const [isMonthExpanded, setIsMonthExpanded] = useState(false);

  // Parse selected date parts
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(
      t.getDate()
    ).padStart(2, '0')}`;
  }, []);

  // Format YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Navigate month
  const handlePrevMonth = () => {
    const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
    setCurrentViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    setCurrentViewDate(newDate);
  };

  // Generate 14 days around the selected date for the week strip
  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayNum: number; dayName: string }[] = [];
    const base = new Date(selectedDateObj);
    base.setDate(base.getDate() - 3); // 3 days before, 10 days ahead

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        dayNum: d.getDate(),
        dayName: DAYS_NAMES_ES[d.getDay()],
      });
    }
    return days;
  }, [selectedDateObj]);

  // Generate month grid for the expanded month view
  const monthGrid = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean } | null)[] = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({
        dateStr: formatDateKey(d),
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    return cells;
  }, [currentViewDate]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18191B' : '#FFFFFF',
          borderColor: isDark ? '#2E3135' : '#E5E7EB',
        },
      ]}>
      {/* Top Header: Month title, arrows, quick buttons */}
      <View style={styles.header}>
        <View style={styles.monthControls}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            style={[styles.arrowButton, { backgroundColor: isDark ? '#2A2C30' : '#F3F4F6' }]}>
            <Ionicons name="chevron-back" size={18} color={isDark ? '#F3F4F6' : '#1F2937'} />
          </TouchableOpacity>

          <Text style={[styles.monthTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            {MONTHS_NAMES_ES[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={[styles.arrowButton, { backgroundColor: isDark ? '#2A2C30' : '#F3F4F6' }]}>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#F3F4F6' : '#1F2937'} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.quickPill,
              selectedDate === todayStr && styles.quickPillActive,
              { backgroundColor: selectedDate === todayStr ? '#2563EB' : isDark ? '#2A2C30' : '#F3F4F6' },
            ]}
            onPress={() => {
              setSelectedDate(todayStr);
              setCurrentViewDate(new Date());
            }}>
            <Text
              style={[
                styles.quickPillText,
                { color: selectedDate === todayStr ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563' },
              ]}>
              Hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickPill,
              selectedDate === tomorrowStr && styles.quickPillActive,
              { backgroundColor: selectedDate === tomorrowStr ? '#2563EB' : isDark ? '#2A2C30' : '#F3F4F6' },
            ]}
            onPress={() => {
              setSelectedDate(tomorrowStr);
              const t = new Date();
              t.setDate(t.getDate() + 1);
              setCurrentViewDate(t);
            }}>
            <Text
              style={[
                styles.quickPillText,
                { color: selectedDate === tomorrowStr ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563' },
              ]}>
              Mañana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsMonthExpanded(!isMonthExpanded)}
            style={[
              styles.quickPill,
              isMonthExpanded && styles.quickPillActive,
              { backgroundColor: isMonthExpanded ? '#2563EB' : isDark ? '#2A2C30' : '#F3F4F6' },
            ]}>
            <Ionicons
              name={isMonthExpanded ? 'calendar' : 'calendar-outline'}
              size={14}
              color={isMonthExpanded ? '#FFFFFF' : isDark ? '#D1D5DB' : '#4B5563'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Day Strip or Expanded Month View */}
      {!isMonthExpanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScrollContent}>
          {weekDays.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            const isToday = item.dateStr === todayStr;
            const info = datesWithAppointments[item.dateStr];

            return (
              <TouchableOpacity
                key={item.dateStr}
                onPress={() => {
                  setSelectedDate(item.dateStr);
                  setCurrentViewDate(new Date(item.date));
                }}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isSelected
                      ? '#2563EB'
                      : isToday
                      ? isDark
                        ? '#1E293B'
                        : '#EFF6FF'
                      : isDark
                      ? '#212327'
                      : '#F9FAFB',
                    borderColor: isSelected
                      ? '#1D4ED8'
                      : isToday
                      ? '#93C5FD'
                      : isDark
                      ? '#32353B'
                      : '#E5E7EB',
                  },
                ]}>
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: isSelected
                        ? '#E0E7FF'
                        : isToday
                        ? '#2563EB'
                        : isDark
                        ? '#9CA3AF'
                        : '#6B7280',
                    },
                  ]}>
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isToday
                        ? '#2563EB'
                        : isDark
                        ? '#F3F4F6'
                        : '#1F2937',
                    },
                  ]}>
                  {item.dayNum}
                </Text>

                {/* Appointment dots indicator */}
                <View style={styles.dotContainer}>
                  {info && info.count > 0 ? (
                    info.statuses.slice(0, 3).map((st, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected
                              ? '#FFFFFF'
                              : STATUS_CONFIG[st]?.color || '#3B82F6',
                          },
                        ]}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyDot} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.monthGridContainer}>
          {/* Day column headers */}
          <View style={styles.monthGridWeekHeader}>
            {DAYS_NAMES_ES.map((name) => (
              <Text
                key={name}
                style={[styles.monthGridColHeader, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {name}
              </Text>
            ))}
          </View>

          {/* Month grid days */}
          <View style={styles.monthGrid}>
            {monthGrid.map((cell, idx) => {
              if (!cell) {
                return <View key={`empty-${idx}`} style={styles.gridCellEmpty} />;
              }
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const info = datesWithAppointments[cell.dateStr];

              return (
                <TouchableOpacity
                  key={cell.dateStr}
                  onPress={() => {
                    setSelectedDate(cell.dateStr);
                    setIsMonthExpanded(false);
                  }}
                  style={[
                    styles.gridCell,
                    isSelected && { backgroundColor: '#2563EB' },
                    isToday && !isSelected && { borderWidth: 1, borderColor: '#3B82F6' },
                  ]}>
                  <Text
                    style={[
                      styles.gridCellText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                          ? '#2563EB'
                          : isDark
                          ? '#F3F4F6'
                          : '#1F2937',
                        fontWeight: isSelected || isToday ? '700' : '500',
                      },
                    ]}>
                    {cell.dayNum}
                  </Text>
                  {info && info.count > 0 && (
                    <View style={styles.gridCellDots}>
                      {info.statuses.slice(0, 2).map((st, sIdx) => (
                        <View
                          key={sIdx}
                          style={[
                            styles.dotSmall,
                            {
                              backgroundColor: isSelected
                                ? '#FFFFFF'
                                : STATUS_CONFIG[st]?.color || '#2563EB',
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    padding: 6,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickPillActive: {
    backgroundColor: '#2563EB',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekScrollContent: {
    paddingVertical: 2,
    gap: 8,
  },
  dayCard: {
    width: 58,
    height: 74,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  emptyDot: {
    width: 5,
    height: 5,
  },
  monthGridContainer: {
    marginTop: 6,
  },
  monthGridWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthGridColHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
  },
  gridCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 1,
  },
  gridCellText: {
    fontSize: 13,
  },
  gridCellDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

