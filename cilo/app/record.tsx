import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { RecordOrb, OrbState } from '@/components/record-orb';
import { TIME_THEMES, getTimeOfDay } from '@/constants/time-theme';
import { transcriptsAPI, Transcript, Event } from '@/services/api';

type Phase = 'idle' | 'listening' | 'saving' | 'done' | 'error';
// What to do when the recognizer reports it has ended
type EndAction = 'restart' | 'finish' | 'discard';

const { width } = Dimensions.get('window');
const ORB_SIZE = Math.min(width * 0.55, 240);

const RECOGNITION_OPTIONS = {
  lang: 'en-US',
  interimResults: true,
  continuous: true,
  addsPunctuation: true,
  iosTaskHint: 'dictation' as const,
  volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
};

const SUBTITLES: Record<Phase, string> = {
  idle: 'Tap the orb to start recording',
  listening: 'Listening… tap the orb when you\'re done',
  saving: 'Pulling out to-dos and a summary…',
  done: 'Saved to your day',
  error: 'Something went wrong',
};

function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} sec`;
  return `${Math.round(seconds / 60)} min`;
}

function formatDueDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function RecordScreen() {
  const router = useRouter();
  const theme = TIME_THEMES[getTimeOfDay()];

  const [phase, setPhase] = useState<Phase>('idle');
  const [transcriptText, setTranscriptText] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(Transcript & { tasks: Event[] }) | null>(null);

  // Finished segments from the recognizer, plus the one still being spoken
  const segments = useRef<string[]>([]);
  const interim = useRef('');
  const startedAt = useRef<Date | null>(null);
  const endAction = useRef<EndAction>('discard');

  const fullText = () => [...segments.current, interim.current].join(' ').replace(/\s+/g, ' ').trim();

  const save = async () => {
    const content = fullText();
    const durationMs = startedAt.current ? Date.now() - startedAt.current.getTime() : 0;

    if (!content) {
      setError('Didn\'t catch anything. Try again a little closer to the mic.');
      setPhase('error');
      return;
    }

    setPhase('saving');
    setError(null);
    try {
      const saved = await transcriptsAPI.create({
        content,
        duration: formatDuration(durationMs),
        date: (startedAt.current ?? new Date()).toISOString(),
      });
      setResult(saved);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the transcript.');
      setPhase('error');
    }
  };

  const reset = () => {
    segments.current = [];
    interim.current = '';
    setTranscriptText('');
    setElapsed(0);
    setError(null);
    setResult(null);
    setPhase('idle');
  };

  const startRecording = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Cilo needs microphone and speech recognition access to record. Enable them in Settings.');
      setPhase('error');
      return;
    }

    reset();
    startedAt.current = new Date();
    endAction.current = 'restart';
    setPhase('listening');
    ExpoSpeechRecognitionModule.start(RECOGNITION_OPTIONS);
  };

  const stopRecording = () => {
    endAction.current = 'finish';
    ExpoSpeechRecognitionModule.stop();
  };

  const close = () => {
    if (phase === 'listening') {
      endAction.current = 'discard';
      ExpoSpeechRecognitionModule.abort();
    }
    router.back();
  };

  // Tapping the floating orb is the "start" tap, so begin straight away
  useEffect(() => {
    startRecording();
    return () => {
      if (endAction.current === 'restart') {
        endAction.current = 'discard';
        ExpoSpeechRecognitionModule.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'listening') return;
    const timer = setInterval(() => {
      if (startedAt.current) setElapsed(Date.now() - startedAt.current.getTime());
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript?.trim() ?? '';
    if (event.isFinal) {
      if (text) segments.current.push(text);
      interim.current = '';
    } else {
      interim.current = text;
    }
    setTranscriptText(fullText());
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    // value is -2..10; anything under 0 is inaudible
    setLevel(Math.max(0, Math.min(1, event.value / 10)));
  });

  useSpeechRecognitionEvent('error', (event) => {
    // Silence timeouts just end the session; 'end' restarts it while we're still recording
    if (event.error === 'no-speech' || event.error === 'speech-timeout' || event.error === 'aborted') return;
    endAction.current = 'discard';
    setError(event.error === 'not-allowed'
      ? 'Microphone or speech recognition permission was denied. Enable it in Settings.'
      : event.message || 'Speech recognition stopped unexpectedly.');
    setPhase('error');
  });

  useSpeechRecognitionEvent('end', () => {
    setLevel(0);
    // Keep the interim words; a session can end mid-sentence
    if (interim.current) {
      segments.current.push(interim.current);
      interim.current = '';
    }

    if (endAction.current === 'restart') {
      // The recognizer stops on long silences and platform time limits; carry on transparently
      ExpoSpeechRecognitionModule.start(RECOGNITION_OPTIONS);
    } else if (endAction.current === 'finish') {
      endAction.current = 'discard';
      save();
    }
  });

  const handleOrbPress = () => {
    if (phase === 'listening') stopRecording();
    else if (phase === 'idle' || phase === 'done') startRecording();
  };

  const orbState: OrbState = phase === 'listening' ? 'listening' : phase === 'saving' ? 'processing' : 'idle';
  // Only the tail of a long transcript fits under the orb
  const liveText = transcriptText.length > 220 ? `…${transcriptText.slice(-220)}` : transcriptText;

  return (
    <LinearGradient colors={['#F9FAFB', '#F9FAFB', theme.colors[0]]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.closeButton} onPress={close} accessibilityLabel={phase === 'listening' ? 'Discard recording' : 'Close'}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Record</Text>
            <Text style={styles.headerSubtitle}>{SUBTITLES[phase]}</Text>
          </View>

          <View style={styles.orbArea}>
            <RecordOrb
              size={ORB_SIZE}
              colors={theme.colors}
              state={orbState}
              level={level}
              onPress={handleOrbPress}
              disabled={phase === 'saving' || phase === 'error'}
            />
            {phase === 'listening' && <Text style={styles.clock}>{formatClock(elapsed)}</Text>}
          </View>

          {phase === 'listening' && (
            <View style={styles.liveCard}>
              {liveText ? (
                <Text style={styles.liveText}>{liveText}</Text>
              ) : (
                <Text style={styles.livePlaceholder}>Start talking, your words will appear here</Text>
              )}
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <View style={styles.buttonRow}>
                {fullText() !== '' && (
                  <Pressable style={styles.primaryButton} onPress={save}>
                    <Text style={styles.primaryButtonText}>Try saving again</Text>
                  </Pressable>
                )}
                <Pressable style={styles.secondaryButton} onPress={startRecording}>
                  <Text style={styles.secondaryButtonText}>Record again</Text>
                </Pressable>
              </View>
            </View>
          )}

          {phase === 'done' && result && (
            <View style={styles.resultArea}>
              <View style={[styles.note, { backgroundColor: result.color || '#FEF3E2' }]}>
                <View style={styles.tape} />
                <Text style={styles.noteLabel}>{result.label}</Text>
                <Text style={styles.noteSummary}>
                  {result.summary || 'Saved. The AI summary isn\'t available right now.'}
                </Text>
              </View>

              {result.tasks.length > 0 && (
                <View style={styles.tasksCard}>
                  <Text style={styles.tasksTitle}>Added to your to-dos</Text>
                  {result.tasks.map((task) => (
                    <View key={task._id} style={styles.taskRow}>
                      <View style={styles.taskDot} />
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskDue}>
                        {formatDueDate(task.date)}{task.time ? `, ${task.time}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.buttonRow}>
                <Pressable style={styles.primaryButton} onPress={() => router.back()}>
                  <Text style={styles.primaryButtonText}>Done</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => router.replace({ pathname: '/transcript/[id]' as any, params: { id: result._id } })}
                >
                  <Ionicons name="document-text-outline" size={18} color="#7E57C2" />
                  <Text style={styles.secondaryButtonText}>View transcript</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  orbArea: {
    alignItems: 'center',
    marginTop: 8,
  },
  clock: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: '#6B7280',
    marginTop: -8,
  },
  liveCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    minHeight: 90,
  },
  liveText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  livePlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 18,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultArea: {
    marginTop: 8,
  },
  note: {
    borderRadius: 4,
    padding: 22,
    paddingTop: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ rotate: '-1deg' }],
  },
  tape: {
    position: 'absolute',
    top: -8,
    width: 56,
    height: 15,
    backgroundColor: 'rgba(255, 235, 180, 0.9)',
    borderRadius: 1,
    transform: [{ rotate: '2deg' }],
  },
  noteLabel: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 26,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 10,
  },
  noteSummary: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
  },
  tasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7E57C2',
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  taskDue: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  buttonRow: {
    gap: 12,
    marginTop: 20,
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
});
