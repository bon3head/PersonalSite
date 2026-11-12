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
            '50': 'hsl(353, 100%, 97%)',
            '100': 'hsl(353, 100%, 94%)',
            '200': 'hsl(353, 100%, 86%)',
            '300': 'hsl(353, 100%, 76%)',
            '400': 'hsl(353, 100%, 64%)',
            '500': 'hsl(353, 100%, 50%)',
            '600': 'hsl(353, 100%, 40%)',
            '700': 'hsl(353, 100%, 32%)',
            '800': 'hsl(353, 100%, 24%)',
            '900': 'hsl(353, 100%, 16%)',
            '950': 'hsl(353, 100%, 10%)',
            DEFAULT: '#ff6a7c'
        },
        accent: {
            '50': 'hsl(270, 16%, 97%)',
            '100': 'hsl(270, 16%, 94%)',
            '200': 'hsl(270, 16%, 86%)',
            '300': 'hsl(270, 16%, 76%)',
            '400': 'hsl(270, 16%, 64%)',
            '500': 'hsl(270, 16%, 50%)',
            '600': 'hsl(270, 16%, 40%)',
            '700': 'hsl(270, 16%, 32%)',
            '800': 'hsl(270, 16%, 24%)',
            '900': 'hsl(270, 16%, 16%)',
            '950': 'hsl(270, 16%, 10%)',
            DEFAULT: '#251f2b'
        },
        'neutral-50': '#ffffff',
        'neutral-100': '#000000',
        'neutral-200': '#555555',
        'neutral-300': '#141414',
        'neutral-400': '#767676',
        foreground: '#000000'
    },
    fontFamily: {
        body: [
            'Nunito',
            'sans-serif'
        ],
        heading: [
            'Amatic SC',
            'sans-serif'
        ]
    },
    fontSize: {
        '13': [
            '13px',
            {
                lineHeight: 'normal'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: '20px'
            }
        ],
        '20': [
            '20px',
            {
                lineHeight: 'normal'
            }
        ],
        '25': [
            '25px',
            {
                lineHeight: 'normal',
                letterSpacing: '8px'
            }
        ],
        '30': [
            '30px',
            {
                lineHeight: 'normal'
            }
        ],
        '34': [
            '34px',
            {
                lineHeight: 'normal'
            }
        ],
        '40': [
            '40px',
            {
                lineHeight: 'normal'
            }
        ],
        '50': [
            '50px',
            {
                lineHeight: 'normal'
            }
        ],
        '64': [
            '64px',
            {
                lineHeight: 'normal'
            }
        ]
    },
    spacing: {
        '4': '8px',
        '10': '20px',
        '15': '30px',
        '17': '34px',
        '19': '38px',
        '25': '50px',
        '40': '80px',
        '45': '90px',
        '3px': '3px',
        '25px': '25px'
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '15px'
    },
    transitionDuration: {
        '150': '0.15s',
        '300': '0.3s'
    }
},
  },
};
