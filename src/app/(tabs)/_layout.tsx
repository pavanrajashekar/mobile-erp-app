import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Platform, View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import QuickActionModal from '@/components/QuickActionModal';
import AddExpenseModal from '@/components/AddExpenseModal';

export default function TabsLayout() {
    const [quickActionVisible, setQuickActionVisible] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const { theme } = useTheme();
    const activeColors = Colors[theme];

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    sceneStyle: { backgroundColor: activeColors.background },
                    tabBarStyle: {
                        backgroundColor: activeColors.surface,
                        height: Platform.OS === 'ios' ? 90 : 70, // Slightly reduced height or standard
                        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                        paddingTop: 10,
                        borderTopWidth: 0,
                        shadowColor: activeColors.shadowColor,
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                    },
                    tabBarShowLabel: true, // Maybe labels are helpful now? Or stick to minimal. User said "Home, Add button and Menu".
                    tabBarActiveTintColor: activeColors.primary,
                    tabBarInactiveTintColor: activeColors.tabIconDefault,
                }}
            >
                {/* 1. Home */}
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
                        )
                    }}
                />

                {/* 2. Add Button (Center) */}
                <Tabs.Screen
                    name="add_action"
                    options={{
                        title: '',
                        tabBarLabel: () => null,
                        tabBarIcon: () => null,
                        tabBarButton: (props) => (
                            <TouchableOpacity
                                {...(props as any)}
                                onPress={() => setQuickActionVisible(true)}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 10,
                                }}
                                activeOpacity={0.9}
                            >
                                <View
                                    style={{
                                        width: 56, // Slightly larger
                                        height: 56,
                                        borderRadius: 28,
                                        backgroundColor: activeColors.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: activeColors.primary,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 8,
                                        elevation: 8,
                                        marginTop: -20, // Pop out effect
                                        borderWidth: 4,
                                        borderColor: activeColors.background, // Match bg to look cut-out
                                    }}
                                >
                                    <Ionicons name="add" color="white" size={32} />
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                    listeners={() => ({
                        tabPress: (e) => {
                            e.preventDefault();
                            setQuickActionVisible(true);
                        },
                    })}
                />

                {/* 3. Menu */}
                <Tabs.Screen
                    name="menu"
                    options={{
                        title: 'Menu',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={24} />
                        )
                    }}
                />

                {/* --- HIDDEN TABS --- */}
                <Tabs.Screen
                    name="billing"
                    options={{
                        href: null,
                        title: 'Billing'
                    }}
                />
                <Tabs.Screen
                    name="sales"
                    options={{
                        href: null,
                        title: 'Transactions'
                    }}
                />
                <Tabs.Screen
                    name="products"
                    options={{
                        href: null,
                        title: 'Products'
                    }}
                />
            </Tabs>

            <QuickActionModal
                visible={quickActionVisible}
                onClose={() => setQuickActionVisible(false)}
                onAddExpense={() => setExpenseModalVisible(true)}
            />

            <AddExpenseModal
                visible={expenseModalVisible}
                onClose={() => setExpenseModalVisible(false)}
                onSave={() => {
                    setExpenseModalVisible(false);
                }}
            />
        </>
    );
}
