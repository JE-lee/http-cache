// rollup.config.js
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/HttpGCache.es.js',
      format: 'es'
    },
    {
      file: 'dist/HttpGCache.umd.js',
      format: 'umd',
      name: 'HttpGCache'
    },
    {
      file: 'dist/HttpGCache.cjs.js',
      format: 'cjs'
    }
  ],
  plugins: [
    resolve(),
    commonjs(/*{
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        'node_modules/singlie/index.js': ['Linear']
      }
    }*/) // 将npm 包打包在一起
  ]
}