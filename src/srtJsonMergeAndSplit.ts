import { promises as fs } from 'fs';
import {head,slice,last,trimStart,reduce,chunk} from 'lodash-es'

import {srtObjType, ininSrtObj} from './srt2json.js'

export type optionType = {
    /**
     * 每一份的尺寸
     */
    splitedItemCount: number, 

    splitedStart?: number, 
    /**
     * 拆分的终点, 如需拆分整个文件则设置为 1000000（超大数）或 undefined
     */
    splitedEnd?: number
}

const mergeAndSplit = (arr: srtObjType[] = [], option: optionType) => {

    const {splitedItemCount = arr.length, splitedStart = 0, splitedEnd = arr.length} = option

    let rst: srtObjType[] = []
    let tem: srtObjType[] = []

    // 合并
    arr.forEach((element, index) => {
        tem.push(element)
        const {text} = element
        if (text.substr(-1).match(/[\.\,\/\?\;\!\)\]]/)) {
            const obj = Object.assign({}, ininSrtObj)

            obj.position = rst.length + 1
            const headItem = head(tem) as srtObjType
            obj.start = headItem.start
            // obj.timer1 = headItem.timer1
            const lastItem = last(tem) as srtObjType
            obj.end = lastItem.end
            // obj.timer2 = lastItem.timer2
            obj.text = trimStart(reduce(tem, (r, e) => `${r} ${e.text}`, ''))

            rst.push(obj)

            tem = []
        }
    });

    // 分割
    const sliceArr = slice(rst, splitedStart, splitedEnd)

    // 拆分
    const chunkRst = chunk(sliceArr,splitedItemCount)

    return chunkRst // 二维数组
}

export default mergeAndSplit

const test = async() => {
    const body = await fs.readFile("./srt_json.json")
    const { content = [] } = JSON.parse(body.toString())

    const rst = mergeAndSplit(content, {splitedItemCount: 100})
    fs.writeFile('./srt_json_merge.json', JSON.stringify({data: rst}))
}

// test()

