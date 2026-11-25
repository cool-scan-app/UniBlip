import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import light from 'expo-symbols/androidWeights/light';
import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isValidStore, useActiveStore } from '@/features/store-selection/active-store';

const STORE_HINT = 'Choose a store before scanning, so we can find products in the right catalog.';

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

function HomeNavigation({ onScan }: { onScan: () => void }) {
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
        if (label === 'Scan') {
          return (
            <Pressable
              key={label}
              onPress={onScan}
              accessibilityRole="button"
              accessibilityLabel="Scan products"
              style={styles.navigationItem}>
              <View style={styles.scanItem}>{content}</View>
            </Pressable>
          );
        }
        if (label === 'Cart') {
          return (
            <Pressable
              key={label}
              onPress={() => router.navigate('/cart')}
              accessibilityRole="button"
              accessibilityLabel="Open cart"
              style={styles.navigationItem}>
              {content}
            </Pressable>
          );
        }
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
  const { activeStore } = useActiveStore();
  const [showStoreHint, setShowStoreHint] = useState(false);
  const hasStore = isValidStore(activeStore);

  // Scanning needs an active store (#20). Without one, explain why instead.
  const openScanner = () => {
    if (hasStore) {
      setShowStoreHint(false);
      router.push('/scan');
    } else {
      setShowStoreHint(true);
      AccessibilityInfo.announceForAccessibility(STORE_HINT);
    }
  };

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
            accessibilityLabel={hasStore ? `Current store: ${activeStore.name}` : 'Choose a store, coming soon'}
            accessibilityState={{ disabled: true }}
            aria-disabled>
            <View style={styles.storeSelectorBackground}>
              <Text style={styles.storeText} numberOfLines={1}>{hasStore ? activeStore.name : 'Choose a store...'}</Text>
              <Image
                source={require('@/assets/images/store-selector-icon.svg')}
                style={styles.storeIcon}
                contentFit="contain"
              />
            </View>
          </Pressable>
        </View>
        <View style={styles.content} />
        {showStoreHint && !hasStore ? (
          <View style={styles.storeHint} accessibilityLiveRegion="polite" testID="store-required-hint">
            <SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} size={22} tintColor={colors.text} />
            <Text style={styles.storeHintText}>{STORE_HINT}</Text>
          </View>
        ) : null}
        <HomeNavigation onScan={openScanner} />
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
  storeHint: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.placeholder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeHintText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  navigationLabel: {
    color: colors.text,
    fontSize: 12,
  },
});
