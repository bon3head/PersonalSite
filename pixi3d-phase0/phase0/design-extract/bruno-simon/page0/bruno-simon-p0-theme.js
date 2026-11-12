// React Theme — extracted from https://bruno-simon.com/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '13': string;
    '16': string;
    '20': string;
    '25': string;
    '30': string;
    '34': string;
    '40': string;
    '50': string;
    '64': string;
 *   };
 *   space: {
    '3': string;
    '8': string;
    '20': string;
    '25': string;
    '30': string;
    '34': string;
    '38': string;
    '50': string;
    '80': string;
    '90': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
    lg: string;
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
    "secondary": "#ff6a7c",
    "accent": "#251f2b",
    "foreground": "#000000",
    "neutral50": "#ffffff",
    "neutral100": "#000000",
    "neutral200": "#555555",
    "neutral300": "#141414",
    "neutral400": "#767676"
  },
  "fonts": {
    "body": "'Nunito', sans-serif"
  },
  "fontSizes": {
    "13": "13px",
    "16": "16px",
    "20": "20px",
    "25": "25px",
    "30": "30px",
    "34": "34px",
    "40": "40px",
    "50": "50px",
    "64": "64px"
  },
  "space": {
    "3": "3px",
    "8": "8px",
    "20": "20px",
    "25": "25px",
    "30": "30px",
    "34": "34px",
    "38": "38px",
    "50": "50px",
    "80": "80px",
    "90": "90px"
  },
  "radii": {
    "sm": "4px",
    "md": "8px",
    "lg": "15px"
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
      "main": "#ff6a7c",
      "light": "hsl(353, 100%, 86%)",
      "dark": "hsl(353, 100%, 56%)"
    },
    "background": {},
    "text": {
      "primary": "#000000",
      "secondary": "#ffffff"
    }
  },
  "typography": {
    "fontFamily": "'Nunito', sans-serif",
    "h1": {
      "fontSize": "34px",
      "fontWeight": "700",
      "lineHeight": "normal"
    },
    "h2": {
      "fontSize": "25px",
      "fontWeight": "700",
      "lineHeight": "normal"
    }
  },
  "shape": {
    "borderRadius": 8
  },
  "shadows": []
};

export default theme;
