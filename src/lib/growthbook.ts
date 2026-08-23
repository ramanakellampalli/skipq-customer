import { GrowthBook } from '@growthbook/growthbook-react';
import Config from 'react-native-config';

export const growthbook = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: Config.GROWTHBOOK_CLIENT_KEY,
  enableDevMode: __DEV__,
  subscribeToChanges: true,
  onFeatureUsage(featureKey, result) {
    if (__DEV__) {
      console.log(`[GrowthBook] ${featureKey} →`, result.value);
    }
  },
});
