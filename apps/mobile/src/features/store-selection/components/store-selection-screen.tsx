import StoreCard from '@/features/store-selection/components/store';
import { Store, useActiveStore } from '@/features/store-selection/active-store';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView, SymbolViewProps } from 'expo-symbols';


const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  placeholder: '#DFE8F2',
  text: '#203D5D',
};

type IconName = SymbolViewProps['name'];

export function StoreSelectionScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveStore } = useActiveStore();

  const router = useRouter();

  const pickStore = (store: Store) => {
    setActiveStore(store);
    router.push('/');
  };

  useEffect(() => {
    const getStoresFromApi = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/stores`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: Store[] = await response.json();
        setStores(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    getStoresFromApi();
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Failed to load stores: {error}</Text>;

  return (
    <SafeAreaView style={styles.safeArea } edges={['top', 'left', 'right', 'bottom']}>
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
            </View>
            <View style={styles.topBar}>
                <View style={styles.side}>
                    <SymbolView
                    name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                    size={28}
                    accessibilityLabel="Back"
                    tintColor={colors.text}
                    onClick={() => router.back()}
                    />
                </View>
                <Text style={styles.heading}>Stores</Text>
                <View style={styles.side} />
            </View>
            <StoreList stores={stores} pickStore={pickStore} />
            
        </View>
    </SafeAreaView>
  );
}

function StoreList({ stores, pickStore }: { stores: Store[]; pickStore: (store: Store) => void }) {
  return (
    <View style={styles.page}>
      {stores.map((s) => (
        <StoreCard key={s.id} store={s} onPress={() => pickStore(s)} />
      ))}
    </View>
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
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    side: {
        flex: 1,                    
        alignItems: 'flex-start', 
    },
    icon: {
        width: 24,
        height: 24,
    },
    heading: {
        fontSize: 24, 
        fontWeight: 'bold', 
        margin: 16,
        color: colors.text,
    },
  });