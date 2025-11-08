const brandPrimary = '#5A54FF';
const brandSecondary = '#FF8A5C';
const brandBackgroundLight = '#F5F3FF';
const brandBackgroundDark = '#0F1018';

export default {
  light: {
    text: '#1C1C1E',
    mutedText: '#5C5C63',
    background: brandBackgroundLight,
    surface: '#FFFFFF',
    surfaceMuted: '#ECE9FF',
    border: '#D9D6FF',
    tint: brandPrimary,
    accent: brandSecondary,
    tabIconDefault: '#A5A3C7',
    tabIconSelected: brandPrimary,
    success: '#2ECC71',
    warning: '#F5A623',
  },
  dark: {
    text: '#F5F5FF',
    mutedText: '#B4B6D6',
    background: brandBackgroundDark,
    surface: '#1C1E2A',
    surfaceMuted: '#272A3A',
    border: '#393B4A',
    tint: '#9EA7FF',
    accent: '#FFB38A',
    tabIconDefault: '#6F7390',
    tabIconSelected: '#9EA7FF',
    success: '#3EDC97',
    warning: '#FFC76B',
  },
};
