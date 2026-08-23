import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import Navigation from './src/navigation';
import { growthbook } from './src/lib/growthbook';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    growthbook.init({ streaming: true });
  }, []);

  return (
    <GrowthBookProvider growthbook={growthbook}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Navigation />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </GrowthBookProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
