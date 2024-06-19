// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  // parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  globals: {
    "ajax": false,
    "NFOP": false,
    "define": false,
    "require": false
  },
  env: {
    browser: true,
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // 添加自定义校验规则
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "no-unused-vars": [2, { 
      // 允许声明未使用变量
      "vars": "local",
      // 参数不检查
      "args": "none" 
    }],
    // 关闭语句强制分号结尾
    "semi": 0,
    //空行最多不能超过9行
    "no-multiple-empty-lines": [1, {"max": 9}],
    //关闭禁止混用tab和空格
    "no-mixed-spaces-and-tabs": 0,
    //禁止使用arguments.caller或arguments.callee
    "no-caller": 1,
    //禁止switch穿透
    "no-fallthrough": 1,
    //禁止重复的函数声明
    "no-func-assign": 2,
    //禁止隐式转换
    "no-implicit-coercion": 1,
    //禁止在循环中使用函数（如果没有引用外部变量不形成闭包就可以）
    "no-loop-func": 1,
    //不检查引号类型
    "quotes": 0,
    //函数名和括号之间添加空格
    "space-before-function-paren": 0,
    //不检查缩进
    "indent": 0
  }
}
