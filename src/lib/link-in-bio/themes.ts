export type ThemeId =
  | "minimal-light"
  | "minimal-dark"
  | "ocean"
  | "sunset"
  | "forest"
  | "neon"
  | "pastel"
  | "monochrome";

export type ThemeColors = {
  background: string;
  text: string;
  button: string;
  buttonText: string;
  avatarBg: string;
  avatarText: string;
};

export type Theme = {
  id: ThemeId;
  label: string;
  swatch: string;
  colors: ThemeColors;
  isDark: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "minimal-light",
    label: "Minimal Light",
    swatch: "#ffffff",
    colors: {
      background: "#ffffff",
      text: "#0a0a0a",
      button: "#0a0a0a",
      buttonText: "#ffffff",
      avatarBg: "#0a0a0a",
      avatarText: "#ffffff",
    },
    isDark: false,
  },
  {
    id: "minimal-dark",
    label: "Minimal Dark",
    swatch: "#0a0a0a",
    colors: {
      background: "#0a0a0a",
      text: "#fafafa",
      button: "#fafafa",
      buttonText: "#0a0a0a",
      avatarBg: "#fafafa",
      avatarText: "#0a0a0a",
    },
    isDark: true,
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#0c4a6e",
    colors: {
      background: "#0c4a6e",
      text: "#f0f9ff",
      button: "#f0f9ff",
      buttonText: "#0c4a6e",
      avatarBg: "#0ea5e9",
      avatarText: "#ffffff",
    },
    isDark: true,
  },
  {
    id: "sunset",
    label: "Sunset",
    swatch: "#fff7ed",
    colors: {
      background: "#fff7ed",
      text: "#7c2d12",
      button: "#ea580c",
      buttonText: "#ffffff",
      avatarBg: "#ea580c",
      avatarText: "#ffffff",
    },
    isDark: false,
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "#052e16",
    colors: {
      background: "#052e16",
      text: "#dcfce7",
      button: "#22c55e",
      buttonText: "#052e16",
      avatarBg: "#22c55e",
      avatarText: "#052e16",
    },
    isDark: true,
  },
  {
    id: "neon",
    label: "Neon",
    swatch: "#0f0f0f",
    colors: {
      background: "#0f0f0f",
      text: "#ffffff",
      button: "#a855f7",
      buttonText: "#ffffff",
      avatarBg: "#a855f7",
      avatarText: "#ffffff",
    },
    isDark: true,
  },
  {
    id: "pastel",
    label: "Pastel",
    swatch: "#fdf2f8",
    colors: {
      background: "#fdf2f8",
      text: "#831843",
      button: "#ffffff",
      buttonText: "#831843",
      avatarBg: "#f472b6",
      avatarText: "#ffffff",
    },
    isDark: false,
  },
  {
    id: "monochrome",
    label: "Monochrome",
    swatch: "#ffffff",
    colors: {
      background: "#ffffff",
      text: "#000000",
      button: "#ffffff",
      buttonText: "#000000",
      avatarBg: "#ffffff",
      avatarText: "#000000",
    },
    isDark: false,
  },
];

export function getTheme(id: string | undefined | null): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}