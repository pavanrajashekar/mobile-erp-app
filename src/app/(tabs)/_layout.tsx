import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
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
                    title: 'Sales',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart" color={color} size={size} />
                    )
                }}
            />
        </Tabs>
    );
}
