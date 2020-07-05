const { src, dest, series } = require( 'gulp' );
const path = require('path');
const del = require('del');
const rename = require('gulp-rename');
const fs = require('fs');

const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin')
const cheerio = require('gulp-cheerio')
const replace = require('gulp-replace');
const through2 = require('through2');
const cheerioTrue = require('cheerio');
const gutil = require('gulp-util');
const prettify = require('gulp-html-prettify');
const beautify = require('gulp-beautify');


// LOGIC
function svg() {
    return src('icons/*.svg')
    .pipe(rename({prefix: 'svg-'}))
    .pipe(cheerio({
     run: function ($) {
        // $('[fill]').removeAttr('fill');
        // $('[style]').removeAttr('style');
        // $('defs').find('*').remove();
    },
    parserOptions: {xmlMode: true}
}))
    .pipe(replace('&gt;', '>'))
    .pipe(svgstore())

    .pipe(through2({ objectMode: true },function (file, encoding, cb) {
        var $ = cheerioTrue.load(file.contents.toString(), {xmlMode: true});
        var data = $('svg > symbol').map(function () {
            return {
                name: $(this).attr('id'),
                viewBox: $(this).attr('viewBox')
            };
        }).get();
        var jsonFile = new gutil.File({
            path: 'metadata.json',
            contents: new Buffer.from(JSON.stringify(data))
        });
        var header = '<link rel="stylesheet" href="../main.css">';
        let body = '' ;

        for(var i = 0; i < data.length; i++) {
            body +=  
            '<li class="svg-lib__item">'
            + '<div class="title">' + data[i].name  + '</div>'
            + '<div class="img-wrap">'
            + '<svg class="svg-icon">'
            + '<use xlink:href="#' + data[i].name  + '"></use>'
            + '</svg>'
            +'</div>'
            +'</li>';
        }
        var contentS = $('svg');
        var htmlFile = new gutil.File({
            path: 'metadata.html',
            contents: new Buffer.from('<!DOCTYPE html>'
             + '<html><head>'
             + header
             + '</head><body>' + contentS
             + '<ul class="svg-lib__list">'
             + body +  '</body></html>')
        });

        this.push(jsonFile);
        this.push(htmlFile);
        this.push(file);
        cb();

    }))
    .pipe(dest('sprite'));
}

function templates() {
  return src(['sprite/metadata.html', 'sprite/metadata.json'])
  .pipe(prettify({indent_char: ' ', indent_size: 2}))
  .pipe(dest('sprite'))
}

function beauty() {
    return src('sprite/metadata.json')
    .pipe(beautify({indent_size: 2}))
    .pipe(dest('sprite'))
}

function clean(){ //создаем таск для очишения папки build перед сборкой
    return del('sprite');
}


exports.svg = svg;
exports.templates = templates;
exports.beauty = beauty;
exports.clean = clean;
exports.svgsprite = series( clean, svg, beauty, templates );