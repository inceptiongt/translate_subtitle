import { promises as fs } from 'fs';
import srt2json, {srtObjType} from './srt2json.js'
import srtMergeAndSplit from './srtJsonMergeAndSplit.js'
import {translatedObjectType} from './translateSubtitle.js'
import {srtTranslatedObjType} from './json2srt.js'
import {find} from "lodash"

const formatTranslatedJson = (translatedJson: translatedObjectType[], orginJson: srtObjType[]) => {
    // console.log(translatedJson.length, orginJson.length)
    const rst: srtTranslatedObjType[] = []
    translatedJson.forEach(ele => {
        var {match = [], translated} = ele
        match.forEach(ele => {
            const targetItem = orginJson.find(e => e.position === ele.position)
            if (!targetItem) {return}
            const {start, end, text} = targetItem
            const rstObj = {} as srtTranslatedObjType
            rstObj.position = ele.position
            rstObj.start = start
            rstObj.end = end
            rstObj.text = text
            rstObj.translated = translated
            rst.push(rstObj)
        })
    })
    return rst
}


export default formatTranslatedJson

const test = async() => {
    const originSrtFileUrl = '/Users/gt/Downloads/How Does A Carburetor Work_ _ Transparent Carburetor at 28,546 fps Slow Mo - Smarter Every Day 259 - 英语.srt'

    const content = await fs.readFile(originSrtFileUrl)
    // to Json
    const srtJson = srt2json(content.toString())
    // merge and split
    const srtMergeAndSplitJsonChunks = srtMergeAndSplit(srtJson.content, {splitedItemCount: 100})

    const translatedJson = await fs.readFile('./rst.json')
    const rst = formatTranslatedJson(JSON.parse(translatedJson.toString()), srtMergeAndSplitJsonChunks[0])
    await fs.writeFile('./rst_translated.json', JSON.stringify(rst))
}

// test()