import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

export type EmptyStateVariant = 'cart' | 'products' | 'transactions' | 'search' | 'generic' | 'wifi' | 'list';

interface EmptyStateProps {
    title?: string;
    description?: string;
    variant?: EmptyStateVariant;
    actionLabel?: string;
    onAction?: () => void;
    style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
    title,
    description,
    variant = 'generic',
    actionLabel,
    onAction,
    style
}: EmptyStateProps) {

    const getContent = () => {
        switch (variant) {
            case 'cart':
                return {
                    icon: 'cart-outline',
                    defaultTitle: 'Your cart is empty',
                    defaultDesc: 'Start adding products to create a sale or quote.',
                    bg: '#e0f2fe', // Sky 100
                    color: Colors.primary
                };
            case 'products':
                return {
                    icon: 'cube-outline',
                    defaultTitle: 'No products yet',
                    defaultDesc: 'Add items to your inventory to start tracking stock.',
                    bg: '#fef3c7', // Amber 100
                    color: '#f59e0b' // Amber 500
                };
            case 'transactions':
                return {
                    icon: 'receipt-outline',
                    defaultTitle: 'No transactions',
                    defaultDesc: 'Sales and expenses will appear here once recorded.',
                    bg: '#dcfce7', // Green 100
                    color: Colors.success
                };
            case 'search':
                return {
                    icon: 'search-outline',
                    defaultTitle: 'No results found',
                    defaultDesc: 'Try adjusting your search criteria.',
                    bg: '#f1f5f9', // Slate 100
                    color: Colors.textSecondary
                };
            case 'wifi':
                return {
                    icon: 'wifi-outline',
                    defaultTitle: 'You are offline',
                    defaultDesc: 'Check your internet connection and try again.',
                    bg: '#fee2e2', // Red 100
                    color: Colors.error
                };
            case 'list':
                return {
                    icon: 'list-outline',
                    defaultTitle: 'List is empty',
                    defaultDesc: 'There is nothing here right now.',
                    bg: '#f3f4f6',
                    color: Colors.textSecondary
                };
            default:
                return {
                    icon: 'folder-open-outline',
                    defaultTitle: 'Nothing here',
                    defaultDesc: 'This screen is currently empty.',
                    bg: '#f1f5f9',
                    color: Colors.textSecondary
                };
        }
    };

    const content = getContent();

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconContainer, { backgroundColor: content.bg }]}>
                <Ionicons name={content.icon as any} size={48} color={content.color} />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
                {title || content.defaultTitle}
            </ThemedText>
            <ThemedText type="default" style={styles.description}>
                {description || content.defaultDesc}
            </ThemedText>

            {actionLabel && onAction && (
                <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
                    <ThemedText type="defaultSemiBold" style={styles.buttonText}>{actionLabel}</ThemedText>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        minHeight: 300,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 20,
    },
    description: {
        textAlign: 'center',
        color: Colors.textSecondary,
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        ...Colors.shadow,
    },
    buttonText: {
        color: 'white',
    },
});
