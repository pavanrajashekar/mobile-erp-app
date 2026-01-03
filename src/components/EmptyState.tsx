import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';

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
    const { theme } = useTheme();
    const primary = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const success = useThemeColor({}, 'success');
    const error = useThemeColor({}, 'error');
    const warning = useThemeColor({}, 'warning');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');

    const getContent = () => {
        switch (variant) {
            case 'cart':
                return {
                    icon: 'cart-outline',
                    defaultTitle: 'Your cart is empty',
                    defaultDesc: 'Start adding products to create a sale or quote.',
                    bg: theme === 'dark' ? surfaceSubtle : '#e0f2fe', // Sky 100
                    color: primary
                };
            case 'products':
                return {
                    icon: 'cube-outline',
                    defaultTitle: 'No products yet',
                    defaultDesc: 'Add items to your inventory to start tracking stock.',
                    bg: theme === 'dark' ? surfaceSubtle : '#fef3c7', // Amber 100
                    color: warning
                };
            case 'transactions':
                return {
                    icon: 'receipt-outline',
                    defaultTitle: 'No transactions',
                    defaultDesc: 'Sales and expenses will appear here once recorded.',
                    bg: theme === 'dark' ? surfaceSubtle : '#dcfce7', // Green 100
                    color: success
                };
            case 'search':
                return {
                    icon: 'search-outline',
                    defaultTitle: 'No results found',
                    defaultDesc: 'Try adjusting your search criteria.',
                    bg: surfaceSubtle,
                    color: textSecondary
                };
            case 'wifi':
                return {
                    icon: 'wifi-outline',
                    defaultTitle: 'You are offline',
                    defaultDesc: 'Check your internet connection and try again.',
                    bg: theme === 'dark' ? surfaceSubtle : '#fee2e2', // Red 100
                    color: error
                };
            case 'list':
                return {
                    icon: 'list-outline',
                    defaultTitle: 'List is empty',
                    defaultDesc: 'There is nothing here right now.',
                    bg: surfaceSubtle,
                    color: textSecondary
                };
            default:
                return {
                    icon: 'folder-open-outline',
                    defaultTitle: 'Nothing here',
                    defaultDesc: 'This screen is currently empty.',
                    bg: surfaceSubtle,
                    color: textSecondary
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
            <ThemedText type="default" style={[styles.description, { color: textSecondary }]}>
                {description || content.defaultDesc}
            </ThemedText>

            {actionLabel && onAction && (
                <TouchableOpacity style={[styles.button, { backgroundColor: primary }]} onPress={onAction} activeOpacity={0.8}>
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
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
    },
});
