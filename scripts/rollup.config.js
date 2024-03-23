// import { defineConfig } from 'rollup'
// import fs from 'fs'
// import ts from 'rollup-plugin-typescript2'
// import commonjs from '@rollup/plugin-commonjs'
// import babel from '@rollup/plugin-babel'
// import resolve from '@rollup/plugin-node-resolve'
// import globals from 'rollup-plugin-node-globals'
// import builtins from 'rollup-plugin-node-builtins'
// import terser from '@rollup/plugin-terser'
// import dts from 'rollup-plugin-dts'
// import flow from 'rollup-plugin-flow-no-whitespace'
// import less from 'rollup-plugin-less'
// import CleanCss from 'clean-css'
const fs = require('fs')
const path = require('path')
const ts = require('rollup-plugin-typescript2')
const commonjs = require('@rollup/plugin-commonjs')
const babel = require('@rollup/plugin-babel')
const resolve = require('@rollup/plugin-node-resolve')
const globals = require('rollup-plugin-node-globals')
const builtins = require('rollup-plugin-node-builtins')
const terser = require('@rollup/plugin-terser')
const dts = require('rollup-plugin-dts')
const flow = require('rollup-plugin-flow-no-whitespace')
const postcss = require('rollup-plugin-postcss')
const less = require('rollup-plugin-less')
const CleanCss = require('clean-css')
const rollup = require('rollup')
const alias = require('@rollup/plugin-alias')
const json = require('@rollup/plugin-json')
const version = require('../package.json').version
// const version = ''
const getBanner = (name) => {
    return '/*!\n' +
        ` * ${name} v${version}\n` +
        ` * Github: https://github.com/geekeditor/meditable\n` +
        ` * (c) 2023-${new Date().getFullYear()} montisan <imontisan@gmail.com>\n` +
        ' * Released under the MIT License.\n' +
        ' */';
}

const banner = getBanner('meditable')

function pathResolve(dir) {
    return path.join(__dirname, dir)
}

const config = rollup.defineConfig([
    {
        input: ['src/packages/index.ts'],
        output: [
            {
                dir: 'dist/esm',
                format: 'esm',
                preserveModules: true,
                banner
            },
            {
                dir: 'dist/cjs',
                format: 'cjs',
                preserveModules: true,
                banner
            },
        ],
        plugins: [
            alias({
                entries: [
                    {find: '@', replacement: pathResolve('../src')}
                ]
            }),
            // less({
            //     output: function (styles, styleNodes) {
            //         console.log('sss', styles);
            //         fs.writeFileSync('dist/meditable.css', banner + '\n' + styles)
            //         const compressed = new CleanCss().minify(styles).styles;
            //         fs.writeFileSync('dist/meditable.min.css', banner + '\n' + compressed)
            //         return false;
            //       }
            // }),
            ts(),
            babel({ exclude: '**/node_modules/**' }),
            commonjs()
        ],
    },
    // {
    //     input: 'src/umd.ts',
    //     output: [
    //         {
    //             file: 'dist/umd/index.js',
    //             format: 'umd',
    //             name: 'utils',
    //             banner
    //         },
    //     ],
    //     plugins: [
    //         alias({
    //             entries: [
    //                 {find: '@', replacement:  pathResolve('../src')}
    //             ]
    //         }),
    //         // postcss(),
    //         less({
    //             output: function (styles, styleNodes) {
    //                 console.log('sss', styles);
    //                 fs.writeFileSync('dist/meditable.css', banner + '\n' + styles)
    //                 const compressed = new CleanCss().minify(styles).styles;
    //                 fs.writeFileSync('dist/meditable.min.css', banner + '\n' + compressed)
    //                 return false;
    //               }
    //         }),
            
    //         ts(),
    //         babel({ exclude: '**/node_modules/**' }),
    //         json(),
    //         commonjs(),
    //         resolve({ preferBuiltins: true, mainFields: ['browser'] }),
    //         globals(),
    //         builtins(),
    //         terser(),
    //     ],
    // },
    {
        input: 'src/packages/index.ts',
        output: {
            dir: 'dist/types',
            format: 'esm',
            preserveModules: true,
            banner
        },
        plugins: [
            alias({
                entries: [
                    {find: '@', replacement:  pathResolve('../src')}
                ]
            }),
            dts.default(),
        ],
    },
])

module.exports = config