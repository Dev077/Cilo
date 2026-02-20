import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { transcriptsAPI, Transcript } from '../services/api';

// Fallback colors if transcript doesn't have one
const NOTE_COLORS = [
  '#FEF3E2', '#E8F5E9', '#E3F2FD', '#FFF3E0', 
  '#FCE4EC', '#EDE7F6', '#E0F7FA', '#F3E5F5'
];

function getRandomColor(index: number) {
  return NOTE_COLORS[index % NOTE_COLORS.length];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export default function TranscriptsScreen() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranscripts();
  }, []);

  const loadTranscripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transcriptsAPI.getAll();
      setTranscripts(data);
    } catch (err) {
      setError('Failed to load transcripts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptPress = (id: string) => {
    router.push({
      pathname: `/transcript/[id]` as any,
      params: { id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transcripts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7E57C2" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transcripts</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadTranscripts}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transcripts</Text>
        <Text style={styles.headerSubtitle}>{transcripts.length} conversations</Text>
      </View>

      {/* Notes Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      >
        {transcripts.map((transcript, index) => (
          <Pressable 
            key={transcript._id} 
            style={[
              styles.noteCard, 
              { 
                backgroundColor: transcript.color || getRandomColor(index),
              }
            ]}
            onPress={() => handleTranscriptPress(transcript._id)}
          >
            {/* Tape effect */}
            <View style={styles.tape} />

            {/* Cursive label */}
            <Text style={styles.noteLabel}>{transcript.label}</Text>

            {/* Meta info */}
            <View style={styles.noteMeta}>
              <Text style={styles.noteDate}>{formatDate(transcript.date)}</Text>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7E57C2',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    borderColor: 'rgba(0,0,0,0.05)',
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