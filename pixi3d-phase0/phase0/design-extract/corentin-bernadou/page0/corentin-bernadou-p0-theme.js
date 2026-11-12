// React Theme — extracted from https://corentinbernadou.com/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
 *   };
 *   fonts: {

 *   };
 *   fontSizes: {
    '13.545': string;
    '11.8519': string;
    '10.1587': string;
    '9.31217': string;
    '8.46561': string;
    '5.92593': string;
 *   };
 *   space: {
    '2': string;
    '21': string;
    '42': string;
    '100': string;
 *   };
 *   radii: {
    sm: string;
 *   };
 *   shadows: {

 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#ff0000",
    "secondary": "#ff4401",
    "background": "#070304",
    "foreground": "#000000",
    "neutral50": "#767676",
    "neutral100": "#6d6d6d",
    "neutral200": "#000000",
    "neutral300": "#141414",
    "neutral400": "#858585"
  },
  "fonts": {},
  "fontSizes": {
    "13.545": "13.545px",
    "11.8519": "11.8519px",
    "10.1587": "10.1587px",
    "9.31217": "9.31217px",
    "8.46561": "8.46561px",
    "5.92593": "5.92593px"
  },
  "space": {
    "2": "2px",
    "21": "21px",
    "42": "42px",
    "100": "100px"
  },
  "radii": {
    "sm": "3px"
  },
  "shadows": {},
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#ff0000",
      "light": "hsl(0, 100%, 65%)",
      "dark": "hsl(0, 100%, 35%)"
    },
    "secondary": {
      "main": "#ff4401",
      "light": "hsl(16, 100%, 65%)",
      "dark": "hsl(16, 100%, 35%)"
    },
    "background": {
      "default": "#070304",
      "paper": "#ff0000"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#6d6d6d"
    }
  },
  "typography": {
    "body2": {
      "fontSize": "5.92593px",
      "fontWeight": "700",
      "lineHeight": "5.92593px"
    }
  },
  "shape": {
    "borderRadius": 3
  },
  "shadows": []
};

export default theme;
