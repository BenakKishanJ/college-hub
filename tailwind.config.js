/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/index.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["SpaceGrotesk-Regular"], // replaces default font-sans
        grotesk: ["SpaceGrotesk-Regular"], // for regular
        groteskBold: ["SpaceGrotesk-Bold"], // for bold
      },
    },
  },
  plugins: [],
};
