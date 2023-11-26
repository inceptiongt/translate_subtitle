import { promises as fs } from 'fs';
import {srtObjType} from './srt2json.js'

export type srtTranslatedObjType = srtObjType & {
    translated: string
}

const json2srtDouble = (data: srtTranslatedObjType[]) => {

    const rst: any[] = []
    data.forEach(element => {
        rst.push(
            element.position,
            `${element.start} --> ${element.end}`,
            element.translated,
            element.text,
            '')
    });
    return rst.join('\n')
}

export {json2srtDouble}

const test = async() => {
    const body = await fs.readFile("./rst_translated.json")
    const data = JSON.parse(body.toString())
    const content = await json2srtDouble(data)
    fs.writeFile('./rst_translated.srt',content)
}

// test()
