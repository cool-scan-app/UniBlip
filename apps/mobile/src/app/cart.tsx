import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { formatPrice } from '@/features/barcode-scanning/components/scan-feedback';
import { useCart, type CartItem } from '@/features/cart/cart-gateway';
import { isValidStore, useActiveStore } from '@/features/store-selection/active-store';



function CartProductList({ items }: { items: CartItem[] }) {
    const { activeStore } = useActiveStore();
    const hasStore = isValidStore(activeStore);

    const { itemCount, changeQuantity, removeItem, clearCart } = useCart();
    const [confirmClearStoreId, setConfirmClearStoreId] = useState<string | null>(null);

    const storeId = hasStore ? activeStore.id : null;
    const isConfirmingClear = storeId !== null && confirmClearStoreId === storeId;

    const subtotals = new Map<string, number>();
    let hasUnpricedItems = false;

    for (const { product, quantity } of items) {
    if (product.price === null) {
        hasUnpricedItems = true;
        continue;
    }

    const { amount, currency } = product.price;
    subtotals.set(currency, (subtotals.get(currency) ?? 0) + amount * quantity);
    }

  return (
    <FlatList
      data={items}
      keyExtractor={({ product }) => product.id}
      contentContainerStyle={[
        styles.list,
        items.length === 0 && styles.emptyList,
      ]}
      renderItem={({ item: { product, quantity } }) => (
        <View style={styles.row}>
            <View style={styles.product}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.caption}>Barcode {product.barcode}</Text>

            <View style={styles.cartActions}>
                <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Decrease quantity of ${product.name}`}
                accessibilityState={{ disabled: quantity === 1 }}
                disabled={quantity === 1}
                onPress={() => changeQuantity(product.id, -1)}
                style={[styles.cartAction, quantity === 1 && styles.disabledAction]}>
                <Text style={styles.cartActionLabel}>−</Text>
                </Pressable>

                <Text style={styles.quantity} accessibilityLabel={`Quantity ${quantity}`}>
                {quantity}
                </Text>

                <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${product.name}`}
                onPress={() => changeQuantity(product.id, 1)}
                style={styles.cartAction}>
                <Text style={styles.cartActionLabel}>+</Text>
                </Pressable>

                <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${product.name}`}
                onPress={() => removeItem(product.id)}
                style={styles.cartAction}>
                <Text style={styles.removeLabel}>Remove</Text>
                </Pressable>
            </View>
            </View>

            <Text style={styles.price}>
            {formatPrice(product.price) ?? 'Price unavailable'}
            </Text>
        </View>
        )}
        ListFooterComponent={
        items.length > 0 ? (
            <View style={styles.cartSummary}>
            <Text style={styles.productName}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>

            {subtotals.size === 0 ? (
                <Text style={styles.caption}>Subtotal unavailable</Text>
            ) : (
                Array.from(subtotals, ([currency, amount]) => (
                <Text key={currency} style={styles.productName}>
                    {hasUnpricedItems ? 'Priced items subtotal' : 'Subtotal'}{' '}
                    {formatPrice({ amount, currency })}
                </Text>
                ))
            )}

            {isConfirmingClear ? (
                <>
                <Text style={styles.caption}>Remove all items from this cart?</Text>
                <View style={styles.cartActions}>
                    <Pressable
                    accessibilityRole="button"
                    onPress={() => setConfirmClearStoreId(null)}
                    style={styles.cartAction}>
                    <Text style={styles.cartActionLabel}>Cancel</Text>
                    </Pressable>

                    <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                        clearCart();
                        setConfirmClearStoreId(null);
                    }}
                    style={styles.cartAction}>
                    <Text style={styles.removeLabel}>Remove all items</Text>
                    </Pressable>
                </View>
                </>
            ) : (
                <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmClearStoreId(storeId)}
                style={styles.cartAction}>
                <Text style={styles.removeLabel}>Clear cart</Text>
                </Pressable>
            )}
            </View>
        ) : undefined
        }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyMessage}>
            <Image
              source={require('../../assets/images/uniblip-loading-logo.svg')}
              contentFit="contain"
              style={styles.watermark}
              accessible={false}
            />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            {!hasStore && (
              <Text style={styles.caption}>Choose a store before scanning.</Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (hasStore) {
                router.push('/scan');
              } else {
                router.navigate('/');
              }
            }}
            style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>
              {hasStore ? 'Start Scanning' : 'Return to Home'}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

export default function CartRoute() {
    
    const { items } = useCart();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            My cart
          </Text>
        </View>
        <CartProductList items={items} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    page: {
        flex: 1,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    header: {
        minHeight: 72,
        paddingHorizontal: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#1E3A5F',
        fontSize: 36,
    },
    title: {
        color: '#111827',
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
    },
    list: {
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    row: {
        minHeight: 84,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    product: {
        flex: 1,
        gap: 4,
    },
    productName: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
    },
    caption: {
        color: '#4A6380',
        fontSize: 13,
    },
    quantity: {
        alignSelf: 'flex-start',
        minWidth: 36,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#CCD2DB',
        borderRadius: 10,
        color: '#314F76',
        fontSize: 16,
        textAlign: 'center',
    },
    price: {
        maxWidth: '40%',
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
    },
    empty: {
        gap: 32,
    },
    emptyMessage: {
        minHeight: 217,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    watermark: {
        position: 'absolute',
        width: '65%',
        maxWidth: 221,
        aspectRatio: 1783 / 1756,
        opacity: 0.03,
    },
    emptyTitle: {
        color: '#111827',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    primaryButton: {
        minHeight: 48,
        padding: 12,
        borderRadius: 20,
        backgroundColor: '#3A506B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryLabel: {
        color: '#FFFFFF',
        fontSize: 20,
        textAlign: 'center',
    },
    cartActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        },
    cartAction: {
        minWidth: 44,
        minHeight: 44,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    cartActionLabel: {
        color: '#203D5D',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledAction: {
        opacity: 0.4,
    },
    removeLabel: {
        color: '#B3261E',
        fontSize: 14,
        fontWeight: '600',
    },
    cartSummary: {
        marginTop: 12,
        padding: 16,
        gap: 8,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },


});