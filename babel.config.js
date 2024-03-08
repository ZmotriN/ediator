module.exports = {
    "presets": [
        "@babel/preset-typescript",
        ["@babel/preset-env", { "targets": { "chrome": 109 }}]
    ],
    "plugins": [
        ["@babel/plugin-transform-modules-commonjs", { "strictMode": false }]
    ],
    "shouldPrintComment": (val) => val.startsWith("!")
}