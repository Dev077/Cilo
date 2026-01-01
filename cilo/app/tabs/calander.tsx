import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Pressable, 
  ScrollView, 
  Modal,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const DAY_CELL_SIZE = (width - 48) / 7;

// Mock data for events/transcripts on specific dates
const MOCK_EVENTS: Record<string, Array<{
  id: string;
  label: string;
  type: 'transcript' | 'summary';
  duration?: string;
  color: string;
  rotation: number;
}>> = {
  '2024-12-24': [
    { id: '1', label: 'Sarah', type: 'transcript', duration: '32 min', color: '#FEF3E2', rotation: -2 },
  ],
  '2024-12-23': [
    { id: '2', label: 'Product', type: 'transcript', duration: '45 min', color: '#E8F5E9', rotation: 1 },
    { id: '3', label: 'Alex', type: 'transcript', duration: '28 min', color: '#E3F2FD', rotation: -1 },
  ],
  '2024-12-22': [
    { id: '4', label: 'Budget', type: 'transcript', duration: '60 min', color: '#FFF3E0', rotation: 2 },
  ],
  '2024-12-21': [
    { id: '6', label: 'Marketing', type: 'transcript', duration: '35 min', color: '#EDE7F6', rotation: -1 },
  ],
  '2024-12-20': [
    { id: '7', label: 'Mom', type: 'transcript', duration: '18 min', color: '#E0F7FA', rotation: 1 },
  ],
  '2024-12-19': [
    { id: '8', label: 'Design', type: 'transcript', duration: '40 min', color: '#F3E5F5', rotation: -2 },
  ],
  '2024-12-18': [
    { id: '9', label: 'Standup', type: 'transcript', duration: '15 min', color: '#FEF3E2', rotation: 1 },
  ],
  '2024-12-15': [
    { id: '10', label: 'Investor', type: 'transcript', duration: '55 min', color: '#E8F5E9', rotation: -1 },
  ],
  '2024-12-10': [
    { id: '11', label: 'Planning', type: 'transcript', duration: '40 min', color: '#FCE4EC', rotation: 2 },
  ],
  '2024-12-05': [
    { id: '12', label: 'Review', type: 'transcript', duration: '25 min', color: '#E3F2FD', rotation: -1 },
  ],
};

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(dateKey: string) {
  const date = new Date(dateKey);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleEventPress = (event: any, dateKey: string) => {
    setSelectedEvent({ ...event, date: dateKey });
    setModalVisible(true);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentYear, currentMonth, day);
      const events = MOCK_EVENTS[dateKey] || [];
      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear();
      const hasEvents = events.length > 0;

      days.push(
        <View key={day} style={styles.dayCell}>
          <View style={[styles.dayNumberContainer, isToday && styles.todayContainer]}>
            <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
              {day}
            </Text>
          </View>
          
          {/* Sticky notes for events */}
          {hasEvents && (
            <View style={styles.notesContainer}>
              {events.slice(0, 1).map((event) => (
                <Pressable
                  key={event.id}
                  style={[
                    styles.miniNote,
                    { 
                      backgroundColor: event.color,
                      transform: [{ rotate: `${event.rotation}deg` }],
                    },
                  ]}
                  onPress={() => handleEventPress(event, dateKey)}
                >
                  <View style={styles.miniTape} />
                  <Text style={styles.miniNoteText} numberOfLines={1}>
                    {event.label}
                  </Text>
                </Pressable>
              ))}
              {events.length > 1 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{events.length - 1}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FEFEFE', '#F8F7FC', '#F5F3F0']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSubtitle}>Your conversations</Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
            </Pressable>
            
            <View style={styles.monthTitleContainer}>
              <Text style={styles.monthTitle}>{MONTHS[currentMonth]}</Text>
              <Text style={styles.yearTitle}>{currentYear}</Text>
            </View>
            
            <Pressable onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((day, index) => (
              <View key={index} style={styles.weekDayContainer}>
                <Text style={[
                  styles.weekDayText,
                  (index === 0 || index === 6) && styles.weekendText
                ]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>
            
            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Event Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setModalVisible(false)} 
          />
          
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                {/* Large sticky note */}
                <View 
                  style={[
                    styles.modalNote, 
                    { 
                      backgroundColor: selectedEvent.color,
                      transform: [{ rotate: '-1deg' }],
                    }
                  ]}
                >
                  <View style={styles.modalTape} />
                  
                  <Text style={styles.modalNoteLabel}>{selectedEvent.label}</Text>
                  
                  <View style={styles.modalNoteMeta}>
                    {selectedEvent.duration && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{selectedEvent.duration}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.modalNoteDate}>
                    {formatDisplayDate(selectedEvent.date)}
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <Pressable style={styles.primaryButton}>
                    <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>View Transcript</Text>
                  </Pressable>
                  
                  <Pressable style={styles.secondaryButton}>
                    <Ionicons name="sparkles-outline" size={18} color="#7E57C2" />
                    <Text style={styles.secondaryButtonText}>View Summary</Text>
                  </Pressable>
                </View>

                <Pressable 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Georgia',
  },
  yearTitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    marginBottom: 4,
  },
  weekDayContainer: {
    width: DAY_CELL_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekendText: {
    color: '#D1D5DB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE + 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayContainer: {
    backgroundColor: '#7E57C2',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  todayNumber: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notesContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    position: 'relative',
  },
  miniNote: {
    width: '88%',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  miniTape: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 6,
    backgroundColor: 'rgba(255, 235, 180, 0.95)',
    borderRadius: 1,
  },
  miniNoteText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 9,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 2,
  },
  moreBadge: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    backgroundColor: '#7E57C2',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalNote: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 4,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  modalTape: {
    position: 'absolute',
    top: -8,
    width: 60,
    height: 16,
    backgroundColor: 'rgba(255, 235, 180, 0.95)',
    borderRadius: 1,
    transform: [{ rotate: '1deg' }],
  },
  modalNoteLabel: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 32,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalNoteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalNoteDate: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7E57C2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F0FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7E57C2',
  },
  closeButton: {
    padding: 8,
    marginTop: 8,
  },
});