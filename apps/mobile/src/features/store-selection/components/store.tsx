import { Pressable, View, Text } from "react-native";
import { Store, useActiveStore } from "@/features/store-selection/active-store";

type StoreProps = {
    store: Store;
    onPress: () => void;
};

export default function StoreCard({ store, onPress }: StoreProps) {
    

    return (
        <View id={store.id} style={styles.container}>
            <Pressable onPress={onPress}>
                <Text>{store.name}</Text>
                <Text>Latitude: {store.latitude}</Text>
                <Text>Longitude: {store.longitude}</Text>
            </Pressable>
        </View>
    );
}


const styles = {
    container: {
        padding: '10px',
        border: '1px solid #ccc',
        margin: '5px',
    }
}