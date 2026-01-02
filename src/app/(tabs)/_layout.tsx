import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Platform } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    height: 65,
                    borderTopWidth: 0,
                    elevation: 10, // Shadow for Android
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    paddingTop: 10,
                    paddingBottom: 10,
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#9da0a5',
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size} />
                    )
                }}
            />
            <Tabs.Screen
                name="billing"
                options={{
                    title: 'Billing',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" color={color} size={size} />
                    )
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cube" color={color} size={size} />
                    )
                }}
            />
            <Tabs.Screen
                name="sales"
                options={{
                    title: 'Transactions',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" color={color} size={size} />
                    )
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" color={color} size={size} />
                    )
                }}
            />
        </Tabs>
    );
}
