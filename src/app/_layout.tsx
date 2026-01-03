import { Stack } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            SplashScreen.hideAsync();
        }
    }, [loading]);

    // While loading, we still return the Stack (or null) but the native splash 
    // is covering it because we haven't called hideAsync yet.
    // However, returning null can verify the "blank screen" theory, 
    // so we return the Stack but the splash covers it.

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="(auth)" />
                ) : (
                    <>
                        <Stack.Screen name="index" />
                        <Stack.Screen
                            name="profile"
                            options={{
                                presentation: 'modal',
                                headerShown: false,
                            }}
                        />
                    </>
                )}
            </Stack>
        </>
    );
}
