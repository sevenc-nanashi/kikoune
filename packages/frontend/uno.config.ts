import {
  defineConfig,
  presetAttributify,
  presetWind4,
  PresetWind4Theme,
  transformerDirectives,
} from "unocss";

export default defineConfig<PresetWind4Theme>({
  presets: [
    presetWind4(),
    presetAttributify({
      prefix: "un-",
      prefixedOnly: true,
    }),
  ],
  transformers: [transformerDirectives()],
  theme: {
    font: {
      sans: '"Zen Kaku Gothic New", "sans-serif"',
    },
  },
  variants: [
    (matcher) => {
      if (!matcher.startsWith("pip:")) {
        return matcher;
      }
      return {
        matcher: matcher.slice(4),
        selector: (s) => `body[data-layout="pip"] ${s}`,
      };
    },
    (matcher) => {
      if (!matcher.startsWith("grid:")) {
        return matcher;
      }
      return {
        matcher: matcher.slice(5),
        selector: (s) => `body[data-layout="grid"] ${s}`,
      };
    },
    (matcher) => {
      if (!matcher.startsWith("miniplayer:")) {
        return matcher;
      }
      return {
        matcher: matcher.slice(11),
        selector: (s) => `body:where([data-layout="grid"], [data-layout="pip"]) ${s}`,
      };
    },
  ],
  extendTheme: (theme) => {
    return {
      ...theme,
      breakpoint: {
        ...theme.breakpoint,
        xs: "350px",
      },
    };
  },
});
