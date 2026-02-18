import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Pressable, 
  ScrollView, 
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { transcriptsAPI, Transcript } from '../services/api';

const { width } = Dimensions.get('window');
const DAY_CELL_SIZE = (width - 48) / 7;

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Random rotations for notes
const ROTATIONS = [-2, -1, 0, 1, 2];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Group transcripts by date
function groupByDate(transcripts: Transcript[]): Record<string, Transcript[]> {
  const grouped: Record<string, Transcript[]> = {};
  
  transcripts.forEach((transcript) => {
    const date = new Date(transcript.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(transcript);
  });
  
  return grouped;
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsByDate, setEventsByDate] = useState<Record<string, Transcript[]>>({});

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  useEffect(() => {
    loadTranscripts();
  }, [currentYear, currentMonth]);

  const loadTranscripts = async () => {
    try {
      setLoading(true);
      const data = await transcriptsAPI.getByMonth(currentYear, currentMonth + 1);
      setTranscripts(data);
      setEventsByDate(groupByDate(data));
    } catch (err) {
      console.error('Failed to load transcripts:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEventPress = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
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
      const dayTranscripts = eventsByDate[dateKey] || [];
      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear();
      const hasEvents = dayTranscripts.length > 0;

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
              {dayTranscripts.slice(0, 1).map((transcript, index) => (
                <Pressable
                  key={transcript._id}
                  style={[
                    styles.miniNote,
                    { 
                      backgroundColor: transcript.color || '#FEF3E2',
                      transform: [{ rotate: `${ROTATIONS[index % ROTATIONS.length]}deg` }],
                    },
                  ]}
                  onPress={() => handleEventPress(transcript)}
                >
                  <View style={styles.miniTape} />
                  <Text style={styles.miniNoteText} numberOfLines={1}>
                    {transcript.label}
                  </Text>
                </Pressable>
              ))}
              {dayTranscripts.length > 1 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{dayTranscripts.length - 1}</Text>
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#7E57C2" />
              </View>
            ) : (
              <View style={styles.calendarGrid}>
                {renderCalendarDays()}
              </View>
            )}
            
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
            {selectedTranscript && (
              <>
                {/* Large sticky note */}
                <View 
                  style={[
                    styles.modalNote, 
                    { 
                      backgroundColor: selectedTranscript.color || '#FEF3E2',
                      transform: [{ rotate: '-1deg' }],
                    }
                  ]}
                >
                  <View style={styles.modalTape} />
                  
                  <Text style={styles.modalNoteLabel}>{selectedTranscript.label}</Text>
                  
                  <View style={styles.modalNoteMeta}>
                    {selectedTranscript.duration && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{selectedTranscript.duration}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.modalNoteDate}>
                    {formatDisplayDate(selectedTranscript.date)}
                  </Text>
                </View>

                {/* Preview of content */}
                {selectedTranscript.content && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewText} numberOfLines={3}>
                      {selectedTranscript.content}
                    </Text>
                  </View>
                )}

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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
    marginBottom: 16,
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
  previewContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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