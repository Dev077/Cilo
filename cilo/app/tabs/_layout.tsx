import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { FloatingRecordButton } from '@/components/floating-record-button';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: Platform.OS === 'ios' ? 85 : 60,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#7E57C2',
          tabBarInactiveTintColor: '#9CA3AF',
        }}
      >
        <Tabs.Screen
          name="summary"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transcripts"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <FloatingRecordButton />
    </View>
  );
}