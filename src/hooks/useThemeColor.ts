import { Colors } from '@/constants/Colors';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light
) {
    // Always return the prop for 'light' if it exists, otherwise return the color from Colors.light
    // We ignore 'dark' prop and 'dark' theme.
    const colorFromProps = props.light;

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors.light[colorName];
    }
}
