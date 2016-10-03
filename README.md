# static-builder
build static files use gulp (js/css/fonts/imgs/html)

## Install

```
npm install static-builder
```

## Usage
```javascript
var gulp = require('gulp');
require('static-builder')(gulp, {
    appRoot: __dirname,
    imgSrc: ‘img/’,
    htmlSrc: ‘./’,
    //enableQiniuCDN: true
    //debug: true
});

```
