import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock transcript data categorized by person and topic
const MOCK_TRANSCRIPTS = {
  people: [
    {
      id: 'p1',
      name: 'Sarah Chen',
      transcripts: [
        { id: 't1', title: 'Marketing Strategy Discussion', date: 'Dec 24, 2024', duration: '32 min', preview: 'Discussed Q1 campaign ideas and budget allocation for social media...' },
        { id: 't2', title: 'Weekly Sync', date: 'Dec 20, 2024', duration: '15 min', preview: 'Quick catchup on project status and blockers...' },
      ],
    },
    {
      id: 'p2',
      name: 'Alex Rodriguez',
      transcripts: [
        { id: 't3', title: 'Product Launch Planning', date: 'Dec 23, 2024', duration: '45 min', preview: 'Finalized launch date and went through the checklist...' },
        { id: 't4', title: 'Design Review', date: 'Dec 19, 2024', duration: '28 min', preview: 'Reviewed new UI mockups and provided feedback...' },
      ],
    },
    {
      id: 'p3',
      name: 'Jordan Kim',
      transcripts: [
        { id: 't5', title: 'Investor Update Call', date: 'Dec 22, 2024', duration: '52 min', preview: 'Presented quarterly metrics and growth projections...' },
      ],
    },
  ],
  topics: [
    {
      id: 'top1',
      name: 'Product',
      icon: 'cube-outline',
      transcripts: [
        { id: 't6', title: 'Feature Brainstorm', date: 'Dec 24, 2024', duration: '40 min', preview: 'Explored new feature ideas for v2.0 release...' },
        { id: 't7', title: 'Bug Triage Session', date: 'Dec 21, 2024', duration: '25 min', preview: 'Prioritized critical bugs for the next sprint...' },
      ],
    },
    {
      id: 'top2',
      name: 'Marketing',
      icon: 'megaphone-outline',
      transcripts: [
        { id: 't8', title: 'Campaign Review', date: 'Dec 23, 2024', duration: '35 min', preview: 'Analyzed performance of holiday campaign...' },
      ],
    },
    {
      id: 'top3',
      name: 'Finance',
      icon: 'stats-chart-outline',
      transcripts: [
        { id: 't9', title: 'Budget Planning 2025', date: 'Dec 20, 2024', duration: '60 min', preview: 'Discussed department budgets and hiring plans...' },
        { id: 't10', title: 'Expense Review', date: 'Dec 18, 2024', duration: '20 min', preview: 'Reviewed Q4 expenses and identified cost savings...' },
      ],
    },
  ],
};

type CategoryType = 'people' | 'topics';

export default function TranscriptsScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('people');

  const renderTranscriptCard = (transcript: any) => (
    <Pressable key={transcript.id} style={styles.transcriptCard}>
      <View style={styles.transcriptHeader}>
        <Text style={styles.transcriptTitle}>{transcript.title}</Text>
        <Text style={styles.transcriptDuration}>{transcript.duration}</Text>
      </View>
      <Text style={styles.transcriptPreview} numberOfLines={2}>
        {transcript.preview}
      </Text>
      <Text style={styles.transcriptDate}>{transcript.date}</Text>
    </Pressable>
  );

  const renderPeopleCategory = () => (
    <>
      {MOCK_TRANSCRIPTS.people.map((person) => (
        <View key={person.id} style={styles.categorySection}>
          <View style={styles.personHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {person.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <Text style={styles.categoryName}>{person.name}</Text>
            <Text style={styles.transcriptCount}>
              {person.transcripts.length} {person.transcripts.length === 1 ? 'transcript' : 'transcripts'}
            </Text>
          </View>
          {person.transcripts.map(renderTranscriptCard)}
        </View>
      ))}
    </>
  );

  const renderTopicsCategory = () => (
    <>
      {MOCK_TRANSCRIPTS.topics.map((topic) => (
        <View key={topic.id} style={styles.categorySection}>
          <View style={styles.topicHeader}>
            <View style={styles.topicIcon}>
              <Ionicons name={topic.icon as any} size={20} color="#7E57C2" />
            </View>
            <Text style={styles.categoryName}>{topic.name}</Text>
            <Text style={styles.transcriptCount}>
              {topic.transcripts.length} {topic.transcripts.length === 1 ? 'transcript' : 'transcripts'}
            </Text>
          </View>
          {topic.transcripts.map(renderTranscriptCard)}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transcripts</Text>
      </View>

      {/* Category Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleButton, activeCategory === 'people' && styles.toggleButtonActive]}
          onPress={() => setActiveCategory('people')}
        >
          <Ionicons 
            name="people-outline" 
            size={18} 
            color={activeCategory === 'people' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.toggleText, activeCategory === 'people' && styles.toggleTextActive]}>
            People
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, activeCategory === 'topics' && styles.toggleButtonActive]}
          onPress={() => setActiveCategory('topics')}
        >
          <Ionicons 
            name="folder-outline" 
            size={18} 
            color={activeCategory === 'topics' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[styles.toggleText, activeCategory === 'topics' && styles.toggleTextActive]}>
            Topics
          </Text>
        </Pressable>
      </View>

      {/* Transcripts List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeCategory === 'people' ? renderPeopleCategory() : renderTopicsCategory()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#7E57C2',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8A0BF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  transcriptCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transcriptCard: {
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
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  transcriptDuration: {
    fontSize: 12,
    color: '#7E57C2',
    fontWeight: '500',
    marginLeft: 8,
  },
  transcriptPreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  transcriptDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 20,
  },
});