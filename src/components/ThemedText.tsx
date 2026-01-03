import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption';
};

export default function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    ...rest
}: ThemedTextProps) {
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const primaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'primary');
    const secondaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'textSecondary');

    let color = textColor;
    if (type === 'link') color = primaryColor;
    if (type === 'caption') color = secondaryColor;

    return (
        <Text
            style={[
                { color },
                type === 'default' ? styles.default : undefined,
                type === 'title' ? styles.title : undefined,
                type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                type === 'subtitle' ? styles.subtitle : undefined,
                type === 'link' ? styles.link : undefined,
                type === 'caption' ? styles.caption : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
    },
    title: {
        fontSize: 28, // Strict Revenew styling
        fontWeight: 'bold',
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        lineHeight: 30,
        fontSize: 16,
    },
    caption: {
        fontSize: 12,
    },
});
