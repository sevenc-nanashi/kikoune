import { defineConfig, presetAttributify, presetWind4, transformerDirectives } from "unocss";

export default defineConfig({
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
  extendTheme: (theme) => {
    console.log(theme);
    return {
      ...theme,
      breakpoint: {
        // @ts-expect-error unocssが型付けをさぼっている...
        ...theme.breakpoint,
        xs: "350px",
      },
    };
  },
});
