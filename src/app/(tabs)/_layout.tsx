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
                    sceneStyle: { backgroundColor: activeColors.background }, // Fix for white corners in dark mode
                    tabBarStyle: {
                        backgroundColor: activeColors.surface,
                        height: Platform.OS === 'ios' ? 108 : 88,
                        paddingBottom: Platform.OS === 'ios' ? 38 : 18,
                        paddingTop: 6,
                        borderTopWidth: 0,
                        shadowColor: activeColors.shadowColor,
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                    },
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: activeColors.tabIconSelected,
                    tabBarInactiveTintColor: activeColors.tabIconDefault,
                    tabBarItemStyle: {
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 4,
                    },
                }}

            >
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="billing"
                    options={{
                        title: 'Billing',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "receipt" : "receipt-outline"} color={color} size={24} />
                        ),
                    }}
                />

                {/* Central Add Button */}
                <Tabs.Screen
                    name="add_action"
                    options={{
                        title: '',
                        tabBarLabel: () => null,
                        tabBarIcon: ({ color, focused }) => (
                            <View />
                        ),
                        tabBarButton: (props) => (
                            <TouchableOpacity
                                {...(props as any)}
                                onPress={() => setQuickActionVisible(true)}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 4, // Slight visual lift relative to others if needed, or just alignment
                                }}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: activeColors.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: activeColors.shadowColor,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 4,
                                    }}
                                >
                                    <Ionicons name="add" color="white" size={30} />
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

                <Tabs.Screen
                    name="products"
                    options={{
                        title: 'Products',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "cube" : "cube-outline"} color={color} size={28} />
                        )
                    }}
                />

                <Tabs.Screen
                    name="sales"
                    options={{
                        title: 'Transactions',
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? "list" : "list-outline"} color={color} size={28} />
                        )
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
