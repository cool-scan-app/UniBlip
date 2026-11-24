import StoreCard from '@/features/store-selection/components/store';
import { Store, useActiveStore } from '@/features/store-selection/active-store';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';


// Put this in an env var / config file in a real app
const API_URL = 'http://localhost:8000/api/v1/stores';

export default function StorePicker() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveStore } = useActiveStore();

  const router = useRouter();

  const onpress = (store: Store) => {
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
    <View>
      <Text>Stores</Text>
      {stores.map((s) => (
        <StoreCard key={s.id} store={s} onPress={() => onpress(s)} />
      ))}
    </View>
  );
}