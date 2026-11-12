/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(0, 100%, 97%)',
            '100': 'hsl(0, 100%, 94%)',
            '200': 'hsl(0, 100%, 86%)',
            '300': 'hsl(0, 100%, 76%)',
            '400': 'hsl(0, 100%, 64%)',
            '500': 'hsl(0, 100%, 50%)',
            '600': 'hsl(0, 100%, 40%)',
            '700': 'hsl(0, 100%, 32%)',
            '800': 'hsl(0, 100%, 24%)',
            '900': 'hsl(0, 100%, 16%)',
            '950': 'hsl(0, 100%, 10%)',
            DEFAULT: '#ff0000'
        },
        secondary: {
            '50': 'hsl(16, 100%, 97%)',
            '100': 'hsl(16, 100%, 94%)',
            '200': 'hsl(16, 100%, 86%)',
            '300': 'hsl(16, 100%, 76%)',
            '400': 'hsl(16, 100%, 64%)',
            '500': 'hsl(16, 100%, 50%)',
            '600': 'hsl(16, 100%, 40%)',
            '700': 'hsl(16, 100%, 32%)',
            '800': 'hsl(16, 100%, 24%)',
            '900': 'hsl(16, 100%, 16%)',
            '950': 'hsl(16, 100%, 10%)',
            DEFAULT: '#ff4401'
        },
        'neutral-50': '#767676',
        'neutral-100': '#6d6d6d',
        'neutral-200': '#000000',
        'neutral-300': '#141414',
        'neutral-400': '#858585',
        background: '#070304',
        foreground: '#000000'
    },
    fontSize: {
        '13.545': [
            '13.545px',
            {
                lineHeight: '17.6085px',
                letterSpacing: '-0.203175px'
            }
        ],
        '11.8519': [
            '11.8519px',
            {
                lineHeight: '15.4074px',
                letterSpacing: '-0.203175px'
            }
        ],
        '10.1587': [
            '10.1587px',
            {
                lineHeight: '13.2064px',
                letterSpacing: '-0.203175px'
            }
        ],
        '9.31217': [
            '9.31217px',
            {
                lineHeight: '12.1058px',
                letterSpacing: '-0.203175px'
            }
        ],
        '8.46561': [
            '8.46561px',
            {
                lineHeight: 'normal'
            }
        ],
        '5.92593': [
            '5.92593px',
            {
                lineHeight: '5.92593px',
                letterSpacing: '-0.118519px'
            }
        ]
    },
    spacing: {
        '1': '2px',
        '21': '42px',
        '50': '100px',
        '21px': '21px'
    },
    borderRadius: {
        sm: '3px'
    },
    screens: {
        md: '768px',
        lg: '1024px',
        '1920px': '1920px'
    },
    transitionDuration: {
        '300': '0.3s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '692.487px'
    }
},
  },
};
