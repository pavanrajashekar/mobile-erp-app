import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Platform, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import QuickActionModal from '@/components/QuickActionModal';
import AddExpenseModal from '@/components/AddExpenseModal';

export default function TabsLayout() {
    const [quickActionVisible, setQuickActionVisible] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Colors.white,
                        height: Platform.OS === 'ios' ? 115 : 95,
                        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
                        paddingTop: 10,
                        borderTopWidth: 0,
                        ...Colors.shadow,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                    },
                    tabBarShowLabel: true, // Show labels
                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.disabled,
                    tabBarItemStyle: {
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 4,
                    },
                    tabBarLabelStyle: {
                        marginTop: 4,
                        fontSize: 12,
                        fontWeight: '500',
                    }
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
                        tabBarLabel: () => null, // Hide label for plus button
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
                                }}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: Colors.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        ...Colors.shadow,
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

                {/* Hidden Tabs (like Profile if it needs to be here, though we moved it) */}
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
                    // Ideally refresh dashboard, but global refresh is harder.
                    // For now, it just saves to DB. Dashboard handles its own refresh via focus effect.
                    setExpenseModalVisible(false);
                }}
            />
        </>
    );
}
