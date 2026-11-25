import { Pressable, View, Text, StyleSheet } from "react-native";
import { Store, useActiveStore } from "@/features/store-selection/active-store";

type StoreProps = {
    store: Store;
    onPress: () => void;
};

export default function StoreCard({ store, onPress }: StoreProps) {
    

    return (
        <View id={store.id} style={styles.card}>
            <Pressable onPress={onPress}>
                <Text style={styles.name}>{store.name}</Text>
                <Text style={styles.coordinates}>Latitude: {store.latitude}</Text>
                <Text style={styles.coordinates}>Longitude: {store.longitude}</Text>
            </Pressable>
        </View>
    );
}


const styles = StyleSheet.create({
    card: {
        padding: '10px',
        borderColor: '#F5F7FA',
        borderStyle: 'solid',
        borderWidth: 2,
        margin: '5px',
        borderRadius: '10px',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        backgroundColor: '#F5F7FA',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#203D5D',
    },
    coordinates: {
        fontSize: 14,
        color: '#666',
    }
});