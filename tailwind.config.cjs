module.exports = {
  mode: "jit",
  purge: ["./src/**/*.svelte", "./src/**/*.html"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {},
    colors: {
      green: "#153a33",
      yellow: "#E9C42D",
      gray: "#F4F3F0",
      darkgray: "#EBE9E5",
      white: "#FFFFFF",
      red: "#CC2C30",
      orange: "#F16E34",
      purple: "#5A49A3",
      blue: "#BDD3F2",
      black: "#000000",
    },
    fontFamily: {
      serif: ["Alice", "serif"],
      sans: ["sans-serif"],
      display: ["Righteous"],
    },
    maxWidth: {
      "1/4": "25%",
      "1/3": "33%",
      "1/2": "50%",
      "2/3": "66%",
      "3/4": "75%",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
