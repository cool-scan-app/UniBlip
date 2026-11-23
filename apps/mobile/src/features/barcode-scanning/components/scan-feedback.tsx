/**
 * Status, feedback and recovery actions for every scan state (issue #24).
 * Each state has its own icon *and* wording so feedback never relies on colour.
 */
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Money } from '../product-catalog';
import type { ScanState } from '../scan-session';
import { scannerColors as colors } from './scanner-theme';

type Action = { label: string; onPress: () => void; primary?: boolean };

type Props = {
  state: ScanState;
  storeName: string;
  itemCount: number;
  onResume: () => void;
  onRetry: () => void;
  onClose: () => void;
};

type IconName = SymbolViewProps['name'];
const icon = (ios: string, material: string) => ({ ios, android: material, web: material }) as IconName;

export function ScanFeedback({ state, storeName, itemCount, onResume, onRetry, onClose }: Props) {
  const view = describe(state, storeName, itemCount, { onResume, onRetry, onClose });
  const announcement = `${view.title}. ${view.message ?? ''}`;

  // VoiceOver doesn't honour live regions, so announce status changes explicitly.
  useEffect(() => {
    if (state.status !== 'scanning') AccessibilityInfo.announceForAccessibility(announcement);
  }, [state.status, announcement]);

  return (
    <View style={styles.card} accessibilityLiveRegion="polite" testID={`scan-feedback-${state.status}`}>
      <View style={styles.row}>
        {view.busy ? (
          <ActivityIndicator color={colors.text} accessibilityLabel="Working" />
        ) : (
          <SymbolView name={view.icon} size={28} tintColor={view.tint} />
        )}
        <View style={styles.texts}>
          <Text style={styles.title} accessibilityRole="header">
            {view.title}
          </Text>
          {view.message ? <Text style={styles.message}>{view.message}</Text> : null}
        </View>
      </View>
      {view.actions.length > 0 ? (
        <View style={styles.actions}>
          {view.actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, action.primary && styles.primaryButton, pressed && styles.pressed]}>
              <Text style={[styles.buttonText, action.primary && styles.primaryButtonText]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function describe(
  state: ScanState,
  storeName: string,
  itemCount: number,
  { onResume, onRetry, onClose }: Pick<Props, 'onResume' | 'onRetry' | 'onClose'>,
): { icon: IconName; tint: string; title: string; message?: string; busy?: boolean; actions: Action[] } {
  const scanAgain: Action = { label: 'Scan again', onPress: onResume };
  const nothingAdded = 'Nothing was added to your cart.';

  switch (state.status) {
    case 'scanning':
      return {
        icon: icon('barcode.viewfinder', 'barcode_scanner'),
        tint: colors.text,
        title: 'Point the camera at a barcode',
        message: `Scanning products at ${storeName}.`,
        actions: [],
      };
    case 'looking-up':
      return { icon: icon('magnifyingglass', 'search'), tint: colors.text, title: 'Looking up product…', busy: true, actions: [] };
    case 'not-found':
      return {
        icon: icon('questionmark.circle', 'help'),
        tint: colors.warning,
        title: 'Product not found',
        message: `This barcode isn't in ${storeName}'s catalog. ${nothingAdded}`,
        actions: [scanAgain],
      };
    case 'unsupported':
      return {
        icon: icon('exclamationmark.triangle', 'warning'),
        tint: colors.warning,
        title: state.reason === 'invalid-value' ? "Barcode couldn't be read" : 'Not a product barcode',
        message:
          state.reason === 'invalid-value'
            ? `Try holding the phone steady and closer to the barcode. ${nothingAdded}`
            : `Scan the barcode printed on the product package. ${nothingAdded}`,
        actions: [scanAgain],
      };
    case 'lookup-failed':
      return {
        icon: icon('wifi.exclamationmark', 'wifi_off'),
        tint: colors.error,
        title: "Couldn't look up the product",
        message: `${state.message} ${nothingAdded}`,
        actions: [{ label: 'Try again', onPress: onRetry, primary: true }, { label: 'Scan another', onPress: onResume }],
      };
    case 'adding-to-cart':
      return { icon: icon('cart', 'shopping_cart'), tint: colors.text, title: `Adding ${state.product.name}…`, busy: true, actions: [] };
    case 'added':
      return {
        icon: icon('checkmark.circle.fill', 'check_circle'),
        tint: colors.success,
        title: `Added ${state.product.name}`,
        message: [formatPrice(state.product.price), `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart`]
          .filter(Boolean)
          .join(' · '),
        actions: [{ label: 'Scan next', onPress: onResume, primary: true }, { label: 'Done', onPress: onClose }],
      };
    case 'cart-failed':
      return {
        icon: icon('cart.badge.minus', 'remove_shopping_cart'),
        tint: colors.error,
        title: `Couldn't add ${state.product.name}`,
        message: state.message,
        actions: [{ label: 'Try again', onPress: onRetry, primary: true }, { label: 'Scan another', onPress: onResume }],
      };
  }
}

export function formatPrice(price: Money | null): string | null {
  if (!price) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency }).format(price.amount);
  } catch {
    return `${price.amount.toFixed(2)} ${price.currency}`;
  }
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 44,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  message: {
    color: colors.mutedText,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    flexGrow: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.secondaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.surface,
  },
});
