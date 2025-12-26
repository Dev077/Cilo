import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';

// Mock transcript data
const MOCK_TRANSCRIPTS = [
  {
    id: '1',
    label: 'Sarah Chen',
    date: 'Dec 24, 2024',
    duration: '32 min',
    color: '#FEF3E2',
    borderColor: '#FECDA6',
  },
  {
    id: '2',
    label: 'Product Meeting',
    date: 'Dec 23, 2024',
    duration: '45 min',
    color: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  {
    id: '3',
    label: 'Alex Rodriguez',
    date: 'Dec 23, 2024',
    duration: '28 min',
    color: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  {
    id: '4',
    label: 'Budget Planning',
    date: 'Dec 22, 2024',
    duration: '60 min',
    color: '#FFF3E0',
    borderColor: '#FFCC80',
  },
  {
    id: '5',
    label: 'Jordan Kim',
    date: 'Dec 22, 2024',
    duration: '52 min',
    color: '#FCE4EC',
    borderColor: '#F48FB1',
  },
  {
    id: '6',
    label: 'Marketing Ideas',
    date: 'Dec 21, 2024',
    duration: '35 min',
    color: '#EDE7F6',
    borderColor: '#B39DDB',
  },
  {
    id: '7',
    label: 'Mom',
    date: 'Dec 20, 2024',
    duration: '18 min',
    color: '#E0F7FA',
    borderColor: '#80DEEA',
  },
  {
    id: '8',
    label: 'App Design',
    date: 'Dec 19, 2024',
    duration: '40 min',
    color: '#F3E5F5',
    borderColor: '#CE93D8',
  },
];

export default function TranscriptsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transcripts</Text>
      </View>

      {/* Notes Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      >
        {MOCK_TRANSCRIPTS.map((transcript) => (
          <Pressable 
            key={transcript.id} 
            style={[
              styles.noteCard, 
              { 
                backgroundColor: transcript.color,
                borderColor: transcript.borderColor,
              }
            ]}
          >
            {/* Tape effect */}
            <View style={styles.tape} />

            {/* Cursive label */}
            <Text style={styles.noteLabel}>{transcript.label}</Text>

            {/* Meta info */}
            <View style={styles.noteMeta}>
              <Text style={styles.noteDate}>{transcript.date}</Text>
              <Text style={styles.noteDuration}>{transcript.duration}</Text>
            </View>
          </Pressable>
        ))}
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
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  noteCard: {
    width: '46%',
    aspectRatio: 1,
    margin: '2%',
    borderRadius: 4,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  tape: {
    position: 'absolute',
    top: -6,
    width: 40,
    height: 12,
    backgroundColor: 'rgba(255, 235, 180, 0.8)',
    borderRadius: 1,
    transform: [{ rotate: '-2deg' }],
  },
  noteLabel: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 20,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 26,
  },
  noteMeta: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  noteDuration: {
    fontSize: 10,
    color: '#6B7280',
  },
});