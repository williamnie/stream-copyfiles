# copyFiles

> Copy multiple files


## Install

```
$ npm install stream-copyfiles
```

## Usage

```js
const copyFiles = require('stream-copyfiles')

const source = ['/root/a.js','/root/a/b.js']
const destPath = '/home/files'

await copyFiles(source, destPath)
// with option

const option = {
    overwrite: false, // 是否覆盖文件
    repeatToKeepBoth: false // 重复时是否保留两者
}

await copyFiles(source, copyPath, opitons)

// result

[
  {
    file: '/root/a.js',
    msg: 'success',
    copy: true
  },
  {
    file: '/root/a.js',
    msg: 'file is exist in destPath',
    copy: false
  },
  {
    file: '/root/a.js',
    msg: 'file is not exist or file is not allow read',
    copy: false
  }
]


```
## Options
  
-  overwrite = true && keepBoth = false  覆盖为true 保留两者为false 则直接复制
-  overwrite = false && keepBoth = false  覆盖为false 保留两者为false 则判断文件是否存在，不存在则直接复制，存在则直接跳过
-  overwrite = true && keepBoth = true  覆盖为true 保留两者为true 则判断文件是否存在，不存在则直接复制，存在则重命名
    