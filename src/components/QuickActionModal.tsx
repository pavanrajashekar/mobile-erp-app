import { View, StyleSheet, Modal, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import Card from './Card';

interface QuickActionModalProps {
    visible: boolean;
    onClose: () => void;
    onAddExpense: () => void;
}

export default function QuickActionModal({ visible, onClose, onAddExpense }: QuickActionModalProps) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    const handleAction = (path: string) => {
        onClose();
        // Tabs should be navigated to switch context
        if (path.includes('(tabs)')) {
            router.navigate(path as any);
        } else {
            // Other screens should be pushed
            router.push(path as any);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.handle} />
                            <ThemedText type="subtitle" style={styles.title}>Quick Actions</ThemedText>

                            <View style={styles.grid}>
                                {/* New Sale */}
                                <Card
                                    style={styles.actionCard}
                                    onPress={() => handleAction('/(tabs)/billing')}
                                    variant="flat"
                                >
                                    <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
                                        <Ionicons name="cart" size={24} color={Colors.primary} />
                                    </View>
                                    <ThemedText type="defaultSemiBold">New Sale</ThemedText>
                                </Card>

                                {/* New Quote */}
                                <Card
                                    style={styles.actionCard}
                                    onPress={() => handleAction('/quick-quote')}
                                    variant="flat"
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#e0f7fa' }]}>
                                        <Ionicons name="document-text" size={24} color="#006064" />
                                    </View>
                                    <ThemedText type="defaultSemiBold">New Quote</ThemedText>
                                </Card>

                                {/* Stock In */}
                                <Card
                                    style={styles.actionCard}
                                    onPress={() => handleAction('/products/purchase')}
                                    variant="flat"
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                                        <Ionicons name="cube" size={24} color="#ef6c00" />
                                    </View>
                                    <ThemedText type="defaultSemiBold">Stock In</ThemedText>
                                </Card>

                                {/* Add Expense */}
                                <Card
                                    style={styles.actionCard}
                                    onPress={() => {
                                        onClose();
                                        setTimeout(onAddExpense, 100);
                                    }}
                                    variant="flat"
                                >
                                    <View style={[styles.iconBox, { backgroundColor: Colors.errorLight }]}>
                                        <Ionicons name="wallet" size={24} color={Colors.error} />
                                    </View>
                                    <ThemedText type="defaultSemiBold">Expense</ThemedText>
                                </Card>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        ...Colors.shadow,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionCard: {
        width: '47%', // 2 per row
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
