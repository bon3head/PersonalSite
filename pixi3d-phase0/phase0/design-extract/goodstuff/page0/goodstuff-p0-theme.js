// React Theme — extracted from https://goodstuff.pixijs.io/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
 *   };
 *   fonts: {
    body: string;
    mono: string;
 *   };
 *   fontSizes: {
    '11': string;
    '12': string;
    '14': string;
    '15': string;
    '16': string;
    '24': string;
    '28': string;
    '115.2': string;
    '76.8': string;
    '69.12': string;
    '17.92': string;
 *   };
 *   space: {
    '5': string;
    '38': string;
    '56': string;
    '64': string;
    '72': string;
    '112': string;
    '176': string;
    '192': string;
    '208': string;
    '234': string;
    '258': string;
    '338': string;
 *   };
 *   radii: {
    lg: string;
    full: string;
 *   };
 *   shadows: {
    none: string;
    sm: string;
    lg: string;
    xl: string;
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
    "primary": "#e91e63",
    "secondary": "#ffa838",
    "accent": "#ef4d95",
    "background": "#0d0b16",
    "foreground": "#ffffff",
    "neutral50": "#ffffff"
  },
  "fonts": {
    "body": "'Roboto', sans-serif",
    "mono": "'Roboto Mono', monospace"
  },
  "fontSizes": {
    "11": "11px",
    "12": "12px",
    "14": "14px",
    "15": "15px",
    "16": "16px",
    "24": "24px",
    "28": "28px",
    "115.2": "115.2px",
    "76.8": "76.8px",
    "69.12": "69.12px",
    "17.92": "17.92px"
  },
  "space": {
    "5": "5px",
    "38": "38px",
    "56": "56px",
    "64": "64px",
    "72": "72px",
    "112": "112px",
    "176": "176px",
    "192": "192px",
    "208": "208px",
    "234": "234px",
    "258": "258px",
    "338": "338px"
  },
  "radii": {
    "lg": "16px",
    "full": "999px"
  },
  "shadows": {
    "none": "rgb(255, 255, 255) 0px 0px 0px 2px inset",
    "sm": "rgba(255, 255, 255, 0.18) 3px 3px 0px 0px",
    "lg": "rgba(233, 30, 99, 0.35) 0px 8px 22px 0px",
    "xl": "rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(4, 2, 12, 0.9) 0px 40px 80px -30px"
  },
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
      "main": "#e91e63",
      "light": "hsl(340, 82%, 67%)",
      "dark": "hsl(340, 82%, 37%)"
    },
    "secondary": {
      "main": "#ffa838",
      "light": "hsl(34, 100%, 76%)",
      "dark": "hsl(34, 100%, 46%)"
    },
    "background": {
      "default": "#0d0b16",
      "paper": "#0d0b16"
    },
    "text": {
      "primary": "#ffffff",
      "secondary": "#e91e63"
    }
  },
  "typography": {
    "fontFamily": "'Roboto', sans-serif",
    "h1": {
      "fontSize": "69.12px",
      "fontWeight": "700",
      "lineHeight": "60.8256px"
    },
    "h2": {
      "fontSize": "24px",
      "fontWeight": "700",
      "lineHeight": "normal"
    },
    "body1": {
      "fontSize": "17.92px",
      "fontWeight": "400",
      "lineHeight": "28.672px"
    }
  },
  "shape": {
    "borderRadius": 16
  },
  "shadows": [
    "rgb(233, 30, 99) 0px 0px 0px 2px inset",
    "rgb(255, 255, 255) 0px 0px 0px 2px inset",
    "rgba(255, 255, 255, 0.18) 3px 3px 0px 0px",
    "rgba(233, 30, 99, 0.35) 0px 8px 22px 0px",
    "rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(4, 2, 12, 0.9) 0px 40px 80px -30px"
  ]
};

export default theme;
