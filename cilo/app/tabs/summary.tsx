import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

// Mock data for daily summary
const MOCK_TASKS = [
  { id: '1', title: 'Team standup meeting', time: '10:00 AM', completed: false },
  { id: '2', title: 'Review project proposal', time: '2:00 PM', completed: false },
  { id: '3', title: 'Call with Alex about launch', time: '4:30 PM', completed: false },
];

const MOCK_PAST_EVENTS = [
  { id: '1', title: 'Coffee chat with Sarah', summary: 'Discussed new marketing strategies and Q2 goals', time: 'Yesterday, 3:00 PM' },
  { id: '2', title: 'Product brainstorm', summary: 'Explored new feature ideas for the mobile app', time: 'Yesterday, 11:00 AM' },
  { id: '3', title: 'Investor call', summary: 'Presented roadmap and answered questions about growth metrics', time: '2 days ago' },
];

export default function SummaryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Day</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* To Do Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Do</Text>
          {MOCK_TASKS.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskCheckbox} />
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* What Happened Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Happened</Text>
          {MOCK_PAST_EVENTS.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSummary}>{event.summary}</Text>
              <Text style={styles.eventTime}>{event.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerDate: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  taskTime: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventSummary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  eventTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});