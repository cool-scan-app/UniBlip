/**
 * Full-screen barcode scanner (issues #20, #21, #22, #24).
 *
 * Camera lifecycle: the <CameraView> is only mounted while permission is
 * granted, the screen is focused and the app is in the foreground. Leaving the
 * scanner unmounts it, which releases the camera.
 */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createProductCatalog } from '@/config/integration';
import { useCart } from '@/features/cart/cart-gateway';
import type { Store } from '@/features/store-selection/active-store';

import { DETECTED_BARCODE_TYPES } from '../barcode';
import { useBarcodeScanner, type BarcodeDetection } from '../use-barcode-scanner';
import { ScanFeedback } from './scan-feedback';
import { scannerColors as colors } from './scanner-theme';

export function closeScanner() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function BarcodeScannerScreen({ store }: { store: Store }) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const appIsActive = useAppIsActive();
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(Platform.OS === 'web' ? null : true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [catalog] = useState(createProductCatalog);
  const { gateway, itemCount } = useCart();
  const scanner = useBarcodeScanner({ store, catalog, cart: gateway });

  // Only the web can reliably tell us up front whether a camera exists.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    CameraView.isAvailableAsync()
      .then((available) => !cancelled && setCameraAvailable(available))
      .catch(() => !cancelled && setCameraAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const mountCamera = !!permission?.granted && isFocused && appIsActive && cameraAvailable === true && !cameraError;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          onPress={closeScanner}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          hitSlop={8}
          style={styles.closeButton}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={24} tintColor={colors.overlayText} />
        </Pressable>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>Scan products</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {store.name}
          </Text>
        </View>
      </View>

      <View style={styles.preview}>
        {mountCamera ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: DETECTED_BARCODE_TYPES }}
              onBarcodeScanned={scanner.onBarcodeScanned}
              onMountError={(event) => setCameraError(event.message)}
            />
            <Viewfinder dimmed={!scanner.onBarcodeScanned} />
          </>
        ) : (
          <CameraUnavailable
            permission={permission}
            cameraAvailable={cameraAvailable}
            cameraError={cameraError}
            onRequestPermission={requestPermission}
            onRetryCamera={() => setCameraError(null)}
          />
        )}
      </View>

      {__DEV__ ? <DevBarcodeInput onSubmit={scanner.onBarcodeScanned} /> : null}

      <ScanFeedback
        state={scanner.state}
        storeName={store.name}
        itemCount={itemCount}
        onResume={() => scanner.resume({ intentional: true })}
        onRetry={scanner.retry}
        onClose={closeScanner}
      />
    </SafeAreaView>
  );
}

function Viewfinder({ dimmed }: { dimmed: boolean }) {
  return (
    <View style={styles.viewfinderContainer} pointerEvents="none" aria-hidden>
      <View style={[styles.viewfinder, dimmed && styles.viewfinderDimmed]} />
    </View>
  );
}

type PermissionState = ReturnType<typeof useCameraPermissions>[0];

function CameraUnavailable({
  permission,
  cameraAvailable,
  cameraError,
  onRequestPermission,
  onRetryCamera,
}: {
  permission: PermissionState;
  cameraAvailable: boolean | null;
  cameraError: string | null;
  onRequestPermission: () => void;
  onRetryCamera: () => void;
}) {
  if (!permission || cameraAvailable === null) {
    return (
      <Notice title="Checking camera access…">
        <ActivityIndicator color={colors.overlayText} />
      </Notice>
    );
  }
  if (cameraAvailable === false) {
    return (
      <Notice
        title="No camera available"
        message="This device doesn't have a camera UniBlip can use. Try scanning on your phone instead."
      />
    );
  }
  if (!permission.granted) {
    if (permission.canAskAgain) {
      return (
        <Notice
          title="Allow camera access"
          message="UniBlip uses the camera only to read product barcodes. Nothing is recorded or saved.">
          <NoticeButton label="Allow camera" onPress={onRequestPermission} />
        </Notice>
      );
    }
    const canOpenSettings = Platform.OS !== 'web';
    return (
      <Notice
        title="Camera access is turned off"
        message={
          canOpenSettings
            ? 'To scan products, turn on camera access for UniBlip in Settings.'
            : 'To scan products, allow camera access for this site in your browser settings.'
        }>
        {canOpenSettings ? <NoticeButton label="Open Settings" onPress={() => void Linking.openSettings()} /> : null}
      </Notice>
    );
  }
  if (cameraError) {
    return (
      <Notice title="The camera couldn't start" message="Another app may be using it. Close other camera apps and try again.">
        <NoticeButton label="Try again" onPress={onRetryCamera} />
      </Notice>
    );
  }
  // Granted but paused (screen unfocused or app in background).
  return null;
}

function Notice({ title, message, children }: { title: string; message?: string; children?: ReactNode }) {
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Text style={styles.noticeTitle} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.noticeMessage}>{message}</Text> : null}
      {children}
    </View>
  );
}

function NoticeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.noticeButton, pressed && { opacity: 0.7 }]}>
      <Text style={styles.noticeButtonText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Development-only: type a barcode instead of pointing a camera at it, so the
 * full flow can be tested in a simulator or the web build.
 */
function DevBarcodeInput({ onSubmit }: { onSubmit: ((detection: BarcodeDetection) => void) | undefined }) {
  const [value, setValue] = useState('');
  const submit = () => {
    const data = value.trim();
    if (!data || !onSubmit) return;
    const type = /^\d{13}$/.test(data) ? 'ean13' : /^\d{12}$/.test(data) ? 'upc_a' : /^\d{8}$/.test(data) ? 'ean8' : 'code128';
    onSubmit({ type, data });
    setValue('');
  };
  return (
    <View style={styles.devRow}>
      <TextInput
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        placeholder="DEV: type a barcode"
        placeholderTextColor="#8FA3B8"
        keyboardType="number-pad"
        accessibilityLabel="Development barcode input"
        style={styles.devInput}
      />
      <Pressable
        onPress={submit}
        disabled={!onSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !onSubmit }}
        style={[styles.devButton, !onSubmit && { opacity: 0.4 }]}>
        <Text style={styles.devButtonText}>Scan</Text>
      </Pressable>
    </View>
  );
}

function useAppIsActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    color: colors.overlayText,
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#C9D6E3',
    fontSize: 14,
  },
  preview: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#13263A',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: '78%',
    aspectRatio: 2,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.overlayText,
  },
  viewfinderDimmed: {
    opacity: 0.35,
  },
  notice: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  noticeTitle: {
    color: colors.overlayText,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noticeMessage: {
    color: '#C9D6E3',
    fontSize: 15,
    textAlign: 'center',
  },
  noticeButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  devRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  devInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A5573',
    color: colors.overlayText,
  },
  devButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3A5573',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    color: colors.overlayText,
    fontWeight: '600',
  },
});
