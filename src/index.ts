import srtMergeAndSplit from "./srtJsonMergeAndSplit.js"
import srt2json from "./srt2json.js"
// import json2srt from "./json2srt"
import translate, { translatedObjectType, translatedRstData, translatedRstDataSchema } from "./translateSubtitle.js"
import formatTranslatedJson from './formatTranslatedJson.js'
import { json2srtDouble } from './json2srt.js'
import { promises as fs } from 'fs';
import { waterfall } from 'async'
import { pick, concat, flatten } from 'lodash-es'
import path from 'path'
import 'dotenv/config'
import { CompletionUsage } from "openai/resources/completions.js"
import Ajv from 'ajv'
import  {splitOptions, pricing} from './config.js'

const originSrtFileUrl = process.env.SRT_FILE || ''

const { name } = path.parse(originSrtFileUrl)
const originSrtFilename = `${Date.now()}_${name}`
let translatedJson: translatedObjectType[] = []
let tokenUsaged:CompletionUsage = {
    prompt_tokens: 0,
    completion_tokens:0,
    total_tokens: 0
}

const main = async () => {
    try {
        // 读取 srt 文件
        const content = await fs.readFile(originSrtFileUrl)
        console.log('////读取 srt 文件成功')

        // to Json
        const srtJson = srt2json(content.toString())
        const srtJsonFileName = `./srt2json_${originSrtFilename}.json`
        fs.writeFile(srtJsonFileName, JSON.stringify(srtJson))
        console.log(`////srt 转换 json 成功，并保存为文件: ${srtJsonFileName}`)

        // merge and split and pick
        const srtMergeAndSplitJsonChunks = srtMergeAndSplit(srtJson.content, splitOptions)
        const fileName = `./json_chunks_${originSrtFilename}.json`
        await fs.writeFile(fileName, JSON.stringify(srtMergeAndSplitJsonChunks))
        console.log(`////json merge and split 完成，拆分为${srtMergeAndSplitJsonChunks.length}份 \n 并保存为文件：${fileName}`)

        // translate
        const ajv = new Ajv()
        const validate = ajv.compile(translatedRstDataSchema)
        const arr = srtMergeAndSplitJsonChunks.map((jsonChunk, index, arr) => {
            // to srt and format
            // const srtMergedFormatedFile = json2srt(jsonChunk)
            // await fs.writeFile(`./test.srt ${index}`,srtMergedFormatedFile)
            // pick object
            const pickedArr = jsonChunk.map(ele => pick(ele, ['position', 'text']))
            return async (o: any) => {
                // try {
                    console.log(`////调用 openAI，开始翻译第${index + 1}份，共${arr.length}份。请等待。。。。。。`)
                    const rst = await translate(JSON.stringify(pickedArr), o)

                    const fileName = `./translatedRst_${index + 1}_${originSrtFilename}.json`
                    await fs.writeFile(fileName, JSON.stringify(rst))
                    const { data, usage, model, finish_reason } = rst
                    // 累计 token
                    tokenUsaged.prompt_tokens += usage?.prompt_tokens || 0
                    tokenUsaged.completion_tokens += usage?.completion_tokens || 0
                    tokenUsaged.total_tokens += usage?.total_tokens || 0
                    
                    // 判断请求质量
                    if (finish_reason !== "stop") {
                        throw new Error('finish reson is not stop')
                    }
                    const dataJson = JSON.parse(data) as translatedRstData
                    const valid = validate(dataJson)
                    if (!valid) {
                        throw new Error("json schema no match" + JSON.stringify(validate.errors))
                    }
                    // 保存结果
                    translatedJson = concat<translatedObjectType>(translatedJson, dataJson.translated_better_arry)
                    
                    console.log(`第${index + 1}份，共${arr.length}份。翻译完成，并保存为文件：${fileName}。 \n 使用模型：${model}  \n 本次消耗 token：${JSON.stringify(usage)} \n 累计 token：${JSON.stringify(tokenUsaged)}\n 累计消耗$: ${(pricing.in*tokenUsaged.prompt_tokens/1000+pricing.out*tokenUsaged.completion_tokens/1000).toPrecision(2)}`)
                    return { index }
                // } catch (err) {
                //     console.log('openai err', err)
                // }

            }
        })
        try {
            await waterfall(arr)

        } catch (err) {
            console.log('翻译出错，跳过后续翻译请求', '\n',err)
        }
        const fileNameTranslate = `./translatedRstAll_${originSrtFilename}.json`
        await fs.writeFile(fileNameTranslate, JSON.stringify(translatedJson))
        console.log(`//// 翻译完成，并保存问文件：${fileNameTranslate}`)

        // translate rst json 转换 srt
        const fileNameTranslatedSrt = `./srtFinally_${originSrtFilename}`
        const translatedFormatJson = formatTranslatedJson(translatedJson, flatten(srtMergeAndSplitJsonChunks))
        await fs.writeFile(`${fileNameTranslatedSrt}.json`, JSON.stringify(translatedFormatJson))
        const translatedSrt = json2srtDouble(translatedFormatJson)
        await fs.writeFile(`${fileNameTranslatedSrt}.srt`, translatedSrt)
        console.log(`////生成 json 、srt 完成，并保存为文件：${fileNameTranslatedSrt}`)
    } catch (err) {
        console.log('err', err)
    }

}

main()


