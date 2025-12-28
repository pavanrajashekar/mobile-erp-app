import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FABProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const FAB = ({ onPress, icon = 'add' }: FABProps) => {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <Ionicons name={icon} size={24} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#007AFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
