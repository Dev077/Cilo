import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type SpeechRecognition = typeof import('expo-speech-recognition');

/**
 * expo-speech-recognition is a native module that Expo Go doesn't include; importing it there
 * throws and takes the whole route down. Load it only when it's actually in the build
 * (a development build via `npx expo run:ios`), and fall back to no-ops otherwise.
 */
export const speechAvailable =
  Platform.OS === 'web' || requireOptionalNativeModule('ExpoSpeechRecognition') !== null;

const speech: SpeechRecognition | null = speechAvailable ? require('expo-speech-recognition') : null;

export const SpeechModule = speech?.ExpoSpeechRecognitionModule ?? null;

export const useSpeechEvent: SpeechRecognition['useSpeechRecognitionEvent'] =
  speech?.useSpeechRecognitionEvent ?? (() => {});
