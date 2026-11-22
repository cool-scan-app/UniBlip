import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import light from 'expo-symbols/androidWeights/light';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  placeholder: '#DFE8F2',
  text: '#203D5D',
};

type IconName = SymbolViewProps['name'];

const navigationItems: { label: string; icon: IconName; current?: boolean }[] = [
  { label: 'Home', icon: { ios: 'house', android: 'home', web: 'home' }, current: true },
  { label: 'Me', icon: { ios: 'person', android: 'person', web: 'person' } },
  { label: 'Scan', icon: { ios: 'barcode.viewfinder', android: 'barcode_scanner', web: 'barcode_scanner' } },
  { label: 'Cart', icon: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' } },
  { label: 'Settings', icon: { ios: 'gearshape', android: 'settings', web: 'settings' } },
];

function HomeNavigation() {
  return (
    <View style={styles.navigation} accessibilityLabel="Home navigation">
      {navigationItems.map(({ label, icon, current }) => {
        const content = (
          <>
            <SymbolView
              name={icon}
              size={label === 'Scan' ? 50 : 28}
              weight={{ ios: 'light', android: light }}
              tintColor={colors.text}
            />
            <Text style={styles.navigationLabel}>{label}</Text>
          </>
        );
        return current ? (
          <View key={label} accessible accessibilityLabel="Home, current screen" style={[styles.navigationItem, styles.currentItem]}>
            {content}
          </View>
        ) : (
          <Pressable
            key={label}
            disabled
            accessibilityRole="button"
            accessibilityLabel={`${label}, coming soon`}
            accessibilityState={{ disabled: true }}
            aria-disabled
            style={styles.navigationItem}>
            {label === 'Scan' ? <View style={styles.scanItem}>{content}</View> : content}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.watermarkContainer} pointerEvents="none" aria-hidden>
          <Image
            source={require('@/assets/images/uniblip-loading-logo.svg')}
            style={styles.watermark}
            contentFit="contain"
          />
        </View>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/uniblip-small-logo.svg')}
            style={styles.logo}
            contentFit="contain"
            accessible
            accessibilityLabel="UniBlip"
          />
          <Pressable
            style={styles.storeSelector}
            disabled
            accessible
            accessibilityRole="button"
            accessibilityLabel="Choose a store, coming soon"
            accessibilityState={{ disabled: true }}
            aria-disabled>
            <View style={styles.storeSelectorBackground}>
              <Text style={styles.storeText} numberOfLines={1}>Choose a store...</Text>
              <Image
                source={require('@/assets/images/store-selector-icon.svg')}
                style={styles.storeIcon}
                contentFit="contain"
              />
            </View>
          </Pressable>
        </View>
        <View style={styles.content} />
        <HomeNavigation />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    width: '55%',
    maxWidth: 221,
    aspectRatio: 1783 / 1756,
    opacity: 0.025,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logo: {
    width: 46,
    height: 46,
  },
  storeSelector: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  storeSelectorBackground: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.placeholder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  storeText: {
    color: colors.text,
    fontSize: 14,
    flexShrink: 1,
    marginRight: 'auto',
  },
  storeIcon: {
    width: 20,
    height: 20,
    marginLeft: 12,
  },
  navigation: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 68,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navigationItem: {
    flex: 1,
    minWidth: 48,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  currentItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  scanItem: {
    position: 'absolute',
    top: -28,
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navigationLabel: {
    color: colors.text,
    fontSize: 12,
  },
});
