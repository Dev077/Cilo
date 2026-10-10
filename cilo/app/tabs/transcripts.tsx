import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { transcriptsAPI, Transcript, SearchResult } from '@/services/api';

const SEARCH_DEBOUNCE_MS = 400;

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const latestQuery = useRef('');

  // Reload whenever the tab comes into view; only the first load shows a spinner
  const loadTranscripts = useCallback(async () => {
    try {
      if (!hasLoaded.current) setLoading(true);
      setError(null);
      const data = await transcriptsAPI.getAll();
      setTranscripts(data);
      hasLoaded.current = true;
    } catch (err) {
      setError('Failed to load transcripts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTranscripts();
    }, [loadTranscripts])
  );

  // Semantic search, debounced while typing
  useEffect(() => {
    const trimmed = query.trim();
    latestQuery.current = trimmed;
    if (trimmed.length < 2) {
      setResults(null);
      setSearching(false);
      setSearchError(null);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await transcriptsAPI.search(trimmed);
        // Ignore responses for a query the user has already typed past
        if (latestQuery.current !== trimmed) return;
        setResults(data);
        setSearchError(null);
      } catch (err) {
        if (latestQuery.current !== trimmed) return;
        setSearchError('Search failed. Try again.');
        console.error(err);
      } finally {
        if (latestQuery.current === trimmed) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

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

  const isSearching = query.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transcripts</Text>
        <Text style={styles.headerSubtitle}>{transcripts.length} conversations</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by what was said…"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {searching ? (
          <ActivityIndicator size="small" color="#7E57C2" />
        ) : query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </View>

      {isSearching ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {searchError ? (
            <Text style={styles.emptyText}>{searchError}</Text>
          ) : results && results.length === 0 ? (
            <Text style={styles.emptyText}>No conversations match that.</Text>
          ) : (
            (results || []).map(({ transcript, snippet }) => (
              <Pressable
                key={transcript._id}
                style={styles.resultCard}
                onPress={() => handleTranscriptPress(transcript._id)}
              >
                <View style={[styles.resultSwatch, { backgroundColor: transcript.color || '#FEF3E2' }]} />
                <View style={styles.resultBody}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultLabel} numberOfLines={1}>{transcript.label}</Text>
                    <Text style={styles.resultDate}>{formatDate(transcript.date)}</Text>
                  </View>
                  <Text style={styles.resultSnippet} numberOfLines={3}>{snippet}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : transcripts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Tap the orb to record your first one.</Text>
        </View>
      ) : (
        /* Notes Grid */
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
      )}
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
    // Leave room for the floating record orb
    paddingBottom: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  resultSwatch: {
    width: 6,
  },
  resultBody: {
    flex: 1,
    padding: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  resultLabel: {
    flex: 1,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 18,
    color: '#374151',
    marginRight: 8,
  },
  resultDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultSnippet: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
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