import theme from "../styles/theme";

const blackRgbArray = [0, 0, 0];
const MIN_CONTRAST = 4.5;
const WHITE = theme.colors.white;
const whiteRgbArray = [255, 255, 255];

//from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : null;
}

const rgbToArray = color => color.match(/[\.\d]+/g).map(item => +item);

//from: https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors
function luminanace(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function contrast(rgb1, rgb2) {
  const lum1 = luminanace(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminanace(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function getBlackOrWhiteTextForBg(bgColor) {
  const rgbArray = hexToRgb(bgColor) || rgbToArray(bgColor) || whiteRgbArray;
  const contrastOnBlack = contrast(rgbArray, blackRgbArray);
  return contrastOnBlack > MIN_CONTRAST ? "black" : WHITE;
}
