import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

type LoadingScreenProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
  onLogoReady?: () => void;
};

export function LoadingScreen({ onLayout, onLogoReady }: LoadingScreenProps) {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer} accessible accessibilityRole="progressbar" accessibilityLabel="Loading UniBlip">
        <Image
          source={require('@/assets/images/uniblip-loading-logo.svg')}
          style={styles.logo}
          contentFit="contain"
          onLoad={onLogoReady}
          onError={(event) => {
            console.error('Unable to load the UniBlip loading logo:', event.error);
            onLogoReady?.();
          }}
        />
        <Text style={styles.loading}>Loading</Text>
      </View>
      <Text style={styles.tagline}>one app for every store</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '55%',
    maxWidth: 221,
    aspectRatio: 221 / 217,
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loading: {
    position: 'absolute',
    top: '96%',
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
  tagline: {
    position: 'absolute',
    bottom: '11%',
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
});
