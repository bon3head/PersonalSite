/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(340, 82%, 97%)',
            '100': 'hsl(340, 82%, 94%)',
            '200': 'hsl(340, 82%, 86%)',
            '300': 'hsl(340, 82%, 76%)',
            '400': 'hsl(340, 82%, 64%)',
            '500': 'hsl(340, 82%, 50%)',
            '600': 'hsl(340, 82%, 40%)',
            '700': 'hsl(340, 82%, 32%)',
            '800': 'hsl(340, 82%, 24%)',
            '900': 'hsl(340, 82%, 16%)',
            '950': 'hsl(340, 82%, 10%)',
            DEFAULT: '#e91e63'
        },
        secondary: {
            '50': 'hsl(34, 100%, 97%)',
            '100': 'hsl(34, 100%, 94%)',
            '200': 'hsl(34, 100%, 86%)',
            '300': 'hsl(34, 100%, 76%)',
            '400': 'hsl(34, 100%, 64%)',
            '500': 'hsl(34, 100%, 50%)',
            '600': 'hsl(34, 100%, 40%)',
            '700': 'hsl(34, 100%, 32%)',
            '800': 'hsl(34, 100%, 24%)',
            '900': 'hsl(34, 100%, 16%)',
            '950': 'hsl(34, 100%, 10%)',
            DEFAULT: '#ffa838'
        },
        accent: {
            '50': 'hsl(333, 84%, 97%)',
            '100': 'hsl(333, 84%, 94%)',
            '200': 'hsl(333, 84%, 86%)',
            '300': 'hsl(333, 84%, 76%)',
            '400': 'hsl(333, 84%, 64%)',
            '500': 'hsl(333, 84%, 50%)',
            '600': 'hsl(333, 84%, 40%)',
            '700': 'hsl(333, 84%, 32%)',
            '800': 'hsl(333, 84%, 24%)',
            '900': 'hsl(333, 84%, 16%)',
            '950': 'hsl(333, 84%, 10%)',
            DEFAULT: '#ef4d95'
        },
        'neutral-50': '#ffffff',
        background: '#0d0b16',
        foreground: '#ffffff'
    },
    fontFamily: {
        sans: [
            'Roboto',
            'sans-serif'
        ],
        heading: [
            'Outfit',
            'sans-serif'
        ],
        mono: [
            'Roboto Mono',
            'sans-serif'
        ]
    },
    fontSize: {
        '11': [
            '11px',
            {
                lineHeight: '11px',
                letterSpacing: '1.1px'
            }
        ],
        '12': [
            '12px',
            {
                lineHeight: '12px',
                letterSpacing: '1.44px'
            }
        ],
        '14': [
            '14px',
            {
                lineHeight: 'normal'
            }
        ],
        '15': [
            '15px',
            {
                lineHeight: '15px'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: 'normal'
            }
        ],
        '24': [
            '24px',
            {
                lineHeight: 'normal'
            }
        ],
        '28': [
            '28px',
            {
                lineHeight: '29.4px'
            }
        ],
        '115.2': [
            '115.2px',
            {
                lineHeight: '109.44px',
                letterSpacing: '-4.608px'
            }
        ],
        '76.8': [
            '76.8px',
            {
                lineHeight: '76.8px',
                letterSpacing: '-2.688px'
            }
        ],
        '69.12': [
            '69.12px',
            {
                lineHeight: '60.8256px',
                letterSpacing: '-2.4192px'
            }
        ],
        '17.92': [
            '17.92px',
            {
                lineHeight: '28.672px'
            }
        ]
    },
    spacing: {
        '19': '38px',
        '28': '56px',
        '32': '64px',
        '36': '72px',
        '56': '112px',
        '88': '176px',
        '96': '192px',
        '104': '208px',
        '117': '234px',
        '129': '258px',
        '169': '338px',
        '5px': '5px'
    },
    borderRadius: {
        lg: '16px',
        full: '999px'
    },
    boxShadow: {
        xs: 'rgba(255, 255, 255, 0.18) 3px 3px 0px 0px',
        sm: 'rgba(233, 30, 99, 0.35) 0px 8px 22px 0px'
    },
    transitionDuration: {
        '250': '0.25s',
        '300': '0.3s',
        '350': '0.35s',
        '400': '0.4s',
        '450': '0.45s',
        '500': '0.5s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '1180px'
    }
},
  },
};
