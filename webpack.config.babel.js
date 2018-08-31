import path from 'path'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const __DEV__ = process.env.NODE_ENV !== 'production'

export default {
   mode: __DEV__ ? 'development' : 'production',
   devtool: __DEV__ && 'cheap-module-eval-source-map',
   entry: './src/index',
   output: {
      filename: 'acquire.js',
      path: path.resolve(__dirname, 'dist'),
   },
   module: {
      rules: [
         {
            test: /\.jsx?$/,
            include: [path.resolve(__dirname, 'src')],
            use: {
               loader: 'babel-loader',
               options: {
                  presets: [
                     ['env', { modules: false }],
                     'react',
                     'stage-1',
                  ],
                  plugins: [
                     'react-hot-loader/babel',
                  ],
               },
            },
         },
         {
            test: /\.css$/,
            use: [
               __DEV__ ? 'style-loader' : MiniCssExtractPlugin.loader,
               'css-loader',
            ],
         },
         {
            test: /\.html$/,
            use: {
               loader: 'file-loader',
               options: {
                  name: '[name].[ext]',
               },
            },
         },
         {
            test: /\.(ttf|eot|svg|(woff(2)?))(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: 'file-loader',
         },
      ],
   },
   plugins: [
      new MiniCssExtractPlugin({
         filename: 'acquire.css',
      }),
      ...(!__DEV__ ? new webpack.HotModuleReplacementPlugin() : []),
   ],
   resolve: {
      extensions: ['.js', '.jsx'],
   },
   optimization: {
      noEmitOnErrors: true,
   },
   devServer: {
         contentBase: path.resolve(__dirname, 'dist'),
         port: process.env.HTTP_PORT,
   },
}
