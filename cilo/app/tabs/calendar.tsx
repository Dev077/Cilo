import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { transcriptsAPI, eventsAPI, Transcript, Event } from '@/services/api';

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

// Group transcripts or tasks by local calendar day
function groupByDate<T extends { date: string }>(items: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  
  items.forEach((item) => {
    const date = new Date(item.date);
    const key = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}

// Dots shown per day before collapsing into the count
const MAX_TASK_DOTS = 3;

export default function CalendarScreen() {
  const today = new Date();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsByDate, setEventsByDate] = useState<Record<string, Transcript[]>>({});
  const [tasksByDate, setTasksByDate] = useState<Record<string, Event[]>>({});

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const loadMonth = useCallback(async () => {
    try {
      const [monthTranscripts, monthTasks] = await Promise.all([
        transcriptsAPI.getByMonth(currentYear, currentMonth + 1),
        eventsAPI.getTasksByMonth(currentYear, currentMonth + 1),
      ]);
      setEventsByDate(groupByDate<Transcript>(monthTranscripts));
      setTasksByDate(groupByDate<Event>(monthTasks));
    } catch (err) {
      console.error('Failed to load calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  // Runs on focus and again whenever the month changes (loadMonth changes with it),
  // so deadlines added by a recording show up when you come back to the tab
  useFocusEffect(
    useCallback(() => {
      loadMonth();
    }, [loadMonth])
  );

  const handleToggleTask = async (task: Event) => {
    const key = selectedDate;
    if (!key) return;
    // Optimistically update, then sync with backend
    setTasksByDate((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((t) => (t._id === task._id ? { ...t, completed: !t.completed } : t)),
    }));
    try {
      await eventsAPI.toggleComplete(task._id);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      loadMonth();
    }
  };

  const goToPreviousMonth = () => {
    setLoading(true);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    setLoading(true);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedTranscripts = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  const openTranscript = (id: string) => {
    setSelectedDate(null);
    router.push({
      pathname: '/transcript/[id]' as any,
      params: { id },
    });
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
      const dayTasks = tasksByDate[dateKey] || [];
      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear();
      const hasEvents = dayTranscripts.length > 0;
      const hasTasks = dayTasks.length > 0;

      days.push(
        <Pressable
          key={day}
          style={styles.dayCell}
          disabled={!hasEvents && !hasTasks}
          onPress={() => setSelectedDate(dateKey)}
        >
          <View style={[styles.dayNumberContainer, isToday && styles.todayContainer]}>
            <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
              {day}
            </Text>
          </View>
          
          {/* Sticky notes for events */}
          {hasEvents && (
            <View style={styles.notesContainer}>
              {dayTranscripts.slice(0, 1).map((transcript, index) => (
                <View
                  key={transcript._id}
                  style={[
                    styles.miniNote,
                    { 
                      backgroundColor: transcript.color || '#FEF3E2',
                      transform: [{ rotate: `${ROTATIONS[index % ROTATIONS.length]}deg` }],
                    },
                  ]}
                >
                  <View style={styles.miniTape} />
                  <Text style={styles.miniNoteText} numberOfLines={1}>
                    {transcript.label}
                  </Text>
                </View>
              ))}
              {dayTranscripts.length > 1 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{dayTranscripts.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          {/* Deadlines */}
          {hasTasks && (
            <View style={styles.taskDots}>
              {dayTasks.slice(0, MAX_TASK_DOTS).map((task) => (
                <View
                  key={task._id}
                  style={[styles.taskDot, task.completed && styles.taskDotCompleted]}
                />
              ))}
              {dayTasks.length > MAX_TASK_DOTS && (
                <Text style={styles.taskDotsMore}>+{dayTasks.length - MAX_TASK_DOTS}</Text>
              )}
            </View>
          )}
        </Pressable>
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

      {/* Day Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedDate !== null}
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setSelectedDate(null)} 
          />
          
          <View style={styles.modalContent}>
            {selectedDate && (
              <>
                <Text style={styles.dayTitle}>
                  {formatDisplayDate(`${selectedDate}T12:00:00`)}
                </Text>

                <ScrollView style={styles.dayScroll} showsVerticalScrollIndicator={false}>
                  {selectedTasks.length > 0 && (
                    <View style={styles.daySection}>
                      <Text style={styles.daySectionTitle}>Deadlines</Text>
                      {selectedTasks.map((task) => (
                        <Pressable key={task._id} style={styles.dayTaskRow} onPress={() => handleToggleTask(task)}>
                          <View style={[styles.dayCheckbox, task.completed && styles.dayCheckboxCompleted]}>
                            {task.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </View>
                          <Text style={[styles.dayTaskTitle, task.completed && styles.dayTaskTitleCompleted]}>
                            {task.title}
                          </Text>
                          {task.time && <Text style={styles.dayTaskTime}>{task.time}</Text>}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {selectedTranscripts.length > 0 && (
                    <View style={styles.daySection}>
                      <Text style={styles.daySectionTitle}>Conversations</Text>
                      {selectedTranscripts.map((transcript) => (
                        <Pressable
                          key={transcript._id}
                          style={[styles.dayNote, { backgroundColor: transcript.color || '#FEF3E2' }]}
                          onPress={() => openTranscript(transcript._id)}
                        >
                          <View style={styles.dayNoteHeader}>
                            <Text style={styles.dayNoteLabel} numberOfLines={1}>{transcript.label}</Text>
                            {transcript.duration && (
                              <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={13} color="#6B7280" />
                                <Text style={styles.metaText}>{transcript.duration}</Text>
                              </View>
                            )}
                          </View>
                          {(transcript.summary || transcript.content) ? (
                            <Text style={styles.dayNoteSummary} numberOfLines={3}>
                              {transcript.summary || transcript.content}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <Pressable 
                  style={styles.closeButton}
                  onPress={() => setSelectedDate(null)}
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
  taskDots: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7E57C2',
  },
  taskDotCompleted: {
    backgroundColor: '#D1D5DB',
  },
  taskDotsMore: {
    fontSize: 8,
    fontWeight: '700',
    color: '#7E57C2',
  },
  dayTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  dayScroll: {
    width: '100%',
    maxHeight: 420,
  },
  daySection: {
    marginBottom: 16,
  },
  daySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dayTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCheckboxCompleted: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  dayTaskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayTaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  dayTaskTime: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  dayNote: {
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dayNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayNoteLabel: {
    flex: 1,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    color: '#374151',
    marginRight: 8,
  },
  dayNoteSummary: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
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
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
    marginTop: 8,
  },
});