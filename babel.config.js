// We maintain a babelrc.json because some babel tools only accept static JSON.
// But for Jest, we need to configure some more options to be able to load JSX.
// Jest supports a dynamic babel.config.js so we have this script load the base
// config and extend it.

const path = require("path");
const fs = require("fs");

const baseConfigPath = path.join(__dirname, ".babelrc.json");
const baseConfigJSON = fs.readFileSync(baseConfigPath);

module.exports = api => {
  const isTest = api.env("test");

  const config = JSON.parse(baseConfigJSON);

  if (isTest) {
    config.presets.unshift(["@babel/react"]);
    config.only.push("**/*.jsx");
  }

  return config;
};
