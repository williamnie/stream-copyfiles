const stream = require('stream');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path')
const pipeline = promisify(stream.pipeline);

/**
 * 采用流的方式批量复制文件到指定文件夹
 * 
 * @param {string[]} source 需要复制的文件名
 * @param {string} destPath 目标文件夹
 * @param {Object} options 配置 { overwrite: true 覆盖, keepBoth: false 保留两者,}
 * @returns {Object[]}  复制的结果
 * 
 */
const copyFiles = async (source, destPath, options) => {
    // 判断文件参数是否存在
    if (!source || !Array.isArray(source) || source.length === 0) {
        throw new Error('files do not exist')
    }
    // 判断目标目录参数是否存在
    if (!destPath) {
        throw new Error('Destination directory do not exist')
    }

    // 存放结果的数组，最后会return回去
    const result = []

    const defaltOption = {
        overwrite: true,
        keepBoth: false,
        filter: null,
        rename: null,
        ...(options || {})
    }

    const mkdirsSync = (dirname) => {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }

    const streamCopy = async (readPath, writePath) => {
        await pipeline(
            fs.createReadStream(readPath),
            fs.createWriteStream(writePath)
        );
        result.push({ file: readPath, msg: '', copy: true })
    }

    const fileExist = (file) => {
        let isExist = false
        try {
            // 确定文件是否存在及是否有可读属性
            fs.accessSync(file, fs.constants.R_OK)
            isExist = true
        } catch (err) {
        }
        return isExist
    }

    // rename: (basename) => `${basename}(${dayjs().format('hhmmss')})`,

    const genFileInfo = (file) => {
        let { base, ext, name } = path.parse(file) || {}

        if (defaltOption.rename && typeof defaltOption.rename) {
            base = `${defaltOption.rename(name)}${ext}`
            name = defaltOption.rename(name)
        }

        return { fileFullName: base, fileExt: ext, fileName: name }
    }

    const genNewFileName = (fileExt, fileName) => {
        let count = 1
        const rname = () => {
            const name = path.join(`${destPath}`, `${fileName}-(${count})`)
            return `${name}${fileExt}`
        }
        while (fileExist(rname())) {
            count++
        }
        return `${fileName}-(${count})${fileExt}`
    }


    // 判断复制到的目录是否存在，不存在则创建
    if (!fs.existsSync(destPath)) {
        mkdirsSync(destPath)
    }

    const filesLen = source.length;

    const filCopyList = []

    for (let index = 0; index < filesLen; index++) {
        const file = source[index];

        // 如果file不是string则直接报错
        if (typeof file !== 'string') {
            throw new Error('filePath must be string')
        }

        let fileStat = { path: file }
        try {
            const stat = fs.statSync(file)
            if (stat && stat.isFile()) {
                fileStat = { ...fileStat, ...stat }
            } else {
                result.push({ file, msg: 'do not support dir', copy: false })
                continue
            }
        } catch (error) {
            result.push({ file, msg: 'file is not exist or file is not allow read', copy: false })
            continue
        }

        // 如果有filter，先走filter，返回false以后就直接下一个
        if (defaltOption.filter && typeof defaltOption.filter === 'function') {
            if (!defaltOption.filter(fileStat)) {
                result.push({ file: fileStat.path, msg: 'filter return false', copy: false })
                continue
            }
        }

        const { fileFullName, fileExt, fileName } = genFileInfo(file)

        /**
         * overwrite = true && keepBoth = false  覆盖为true 保留两者为false 则直接复制
         * overwrite = false && keepBoth = false  覆盖为false 保留两者为false 则判断文件是否存在，不存在则直接复制，存在则直接跳过
         * overwrite = true && keepBoth = true  覆盖为true 保留两者为true 则判断文件是否存在，不存在则直接复制，存在则重命名
         */
        let destFileName = path.join(destPath, fileFullName)
        if (defaltOption.overwrite && !defaltOption.keepBoth) {
            await streamCopy(file, destFileName)

            // filCopyList.push(streamCopy(file, destFileName))

        } else if (!defaltOption.overwrite && !defaltOption.keepBoth) {
            if (fileExist(`${destFileName}`)) {
                result.push({ file, msg: 'file is exist in destPath', copy: false })
                continue
            } else {
                await streamCopy(file, destFileName)
                // filCopyList.push(streamCopy(file, destFileName))
            }
        } else {
            if (fileExist(`${destFileName}`)) {
                const nFileName = genNewFileName(fileExt, fileName)
                await streamCopy(file, path.join(destPath, nFileName))
                // filCopyList.push(streamCopy(file, path.join(destPath, nFileName)))
            } else {
                // filCopyList.push(streamCopy(file, destFileName))
                await streamCopy(file, destFileName)
            }
        }
    }
    // await Promise.all(filCopyList)
    return result
}


exports.copyFiles = copyFiles