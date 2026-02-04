/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f4f5f3',
                    100: '#e6e8e2',
                    200: '#cfd2c8',
                    300: '#b7b89f', // Sage Grey - Accent
                    400: '#9ca08d',
                    500: '#777c6d', // Dark Olive Grey - Main
                    600: '#5f6357',
                    700: '#484b42',
                    800: '#32342e',
                    900: '#1e1f1b',
                    950: '#0f100e',
                },
                secondary: {
                    50: '#eeeeee', // Light Grey - Background
                    100: '#e5e5e5',
                    200: '#cbcbcb', // Medium Grey - Borders
                    300: '#b0b0b0',
                    400: '#969696',
                    500: '#7d7d7d',
                    600: '#646464',
                    700: '#4b4b4b',
                    800: '#323232',
                    900: '#191919', // Dark Grey/Black for Text
                    950: '#0d0d0d',
                },
                success: {
                    500: '#22c55e',
                    600: '#16a34a',
                },
                warning: {
                    500: '#eab308',
                    600: '#ca8a04',
                },
                danger: {
                    500: '#ef4444',
                    600: '#dc2626',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
