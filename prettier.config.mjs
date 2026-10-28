/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./frontend/src/app/globals.css",
  tailwindFunctions: ["tw"],
};

export default config;
