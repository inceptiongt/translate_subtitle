import OpenAI from 'openai';
// import { ProxyAgent } from 'proxy-agent';
import { promises as fs } from 'fs';
import { pick } from 'lodash-es';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { model, proxy } from './config.js';
export const translatedRstDataSchema = {
    "type": "object",
    "properties": {
        "translated_better_arry": {
            "type": "array",
            "items": [
                {
                    "type": "object",
                    "properties": {
                        "translated": {
                            "type": "string"
                        },
                        "match": {
                            "type": "array",
                            "items": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "position": {
                                            "type": "integer"
                                        },
                                        "text": {
                                            "type": "string"
                                        }
                                    },
                                    "required": [
                                        "position",
                                        "text"
                                    ]
                                }
                            ],
                            "minItems": 0
                        }
                    },
                    "required": [
                        "translated",
                        "match"
                    ]
                }
            ],
            "minItems": 0
        }
    },
    "required": [
        "translated_better_arry"
    ]
};
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
    httpAgent: new HttpsProxyAgent(proxy)
});
const targetModel = model;
const srtFileName = {
    co: '/Users/gt/Downloads/cut-How Does A Carburetor Work_ _ Transparent Carburetor at 28,546 fps Slow Mo - Smarter Every Day 259 - 英语.srt',
    cfo: '/Users/gt/Downloads/cut-format-How Does A Carburetor Work_ _ Transparent Carburetor at 28,546 fps Slow Mo - Smarter Every Day 259 - 英语.srt',
    cfs: '/Users/gt/Downloads/stt-format-cut-How Does A Carburetor Work？ ｜ Transparent Carburetor at 28,546 fps Slow Mo - Smarter Every Day 259.wav.srt',
    tem: '/Users/gt/Desktop/temp/subtitle/test__0.json'
};
const promtp00 = `You are a program responsible for translating subtitles. 
Your task is to translate the subtitles into 简体中文, maintain a conversational tone, avoid lengthy sentences, and ignore fillers like \"so\", \"you know\", \"[\", \"]\"and \"um\", etc. 
在输入文本中，每两行为一组。在每一组中，第一行为时间戳，字段名为 timestamp，第二行为内容，字段名为 content。
Using the following steps: 
Step 1: 把输入的文本转化成 json 数组，数组每一项是一个 object。每个 object 包括 timestamp 和 content，对应输入文本中的每一组。
Step 2: Translate the whole input into 简体中文, ignore the timestamp in each item, only translate the text. 
Step 3: Split the translated result into short sentences based on punctuation (e.g., periods, exclamation marks, question marks, etc.) 
Step 4: Find out the input items that correspond to each translated sentence.
Step 5: Output as json`;
const promtp01 = `你是一个负责翻译字幕的程序。你的任务是把字幕翻译成中文。
输入是一个 array ，每个 item 包括 position text ，其中 text 表示字幕内容。
按照以下步骤: 
Step 1: 把输入的文本转化成数组，数组每一项是一个 object。每个 object 包括 timestamp 和 text ，对应输入文本中的每一组。这个数组保存在 json 的 data 字段中。
Step 2: 按照顺序，从第一个 object 开始，把的 text 提取出来，直到最后一个 object。把他们拼接成一个长的文本，保存在 json 的 totalContent 字段中。
Step 3: 根据 Step 2 中的长文本，直译成简体中文。保存在 json 的 translated 字段中。
Step 4: 根据 Step 3 的结果，对中文进行意译。意译要求遵守原意的前提下让内容更通俗易懂、符合中文表达习惯。保存在 json 的 translated_better 字段中。
Step 5: 根据标点符号(包括：逗号、句号、感叹号、问号等)将 Step 4 的译文结果拆分成多个短句。保存在 json 的 sentencesArray 字段中。
Step 6: 将 Step 5 中的短句插入 Step 1 中的 data 数组成员中，规则是某条短句的意思与 data 数组成员中英文的意思基本一致，则这条短语保存在json 中 data object的 matchText 字段中。
Step 7: 输出 json，只需要包含 data sentencesArray 字段。`;
const promtp02 = `你是一个负责翻译的程序。你的任务是把英文翻译成简体中文，保持对话的语气，避免长句子。
在输入文本中，每两行为一组。在每一组中，第一行为时间戳，字段名为 timestamp，第二行为内容，字段名为 text
按照以下步骤: 
Step 1: 把输入的文本转化成数组，数组每一项是一个 object。每个 object 包括 timestamp 和 text ，对应输入文本中的每一组。这个数组保存在 json 的 data 字段中。
Step 2: 把 json 中所有的 text 翻译成中文，并把翻译结果保存在每个 object 的 translated 字段中。
Step 3: 输出 json。包括 timestamp text translated 字段`;
const promtp03 = `你是一个负责翻译字幕的程序。你的任务是把字幕翻译成中文。
输入是一个 array ，每个 item 包括 position text ，其中 text 表示字幕内容。
按照以下步骤: 
第一步: 把每个 item 的 text 翻译成中文，并把译文保存在对应item 中的 translated 字段中。从第一个 item 到最后一个 item。

分两种情况：
- 情况一，译文与 item 一一对应。
原文：
item A = {
  "position": 357,
  "text": "I mean you're speeding up."
}
翻译结果：
item A = {
  "position": 357,
  "text": "I mean you're speeding up.",
  "translated": "我的意思是你在加速。"
}

- 情况二，译文对应两个 item （ 如item A 、 item B），则这两个 item 的 text 保持不变，且都使用translated 字段保存译文，如下：
原文：
item A = {
  "position": 362,
  "text": "[F] In order to get full and complete combustion,"
},
item B = {
  "position": 363,
  "text": "you need all the surface area that you can get of the fuel."
}

翻译结果：
下面的译文（[F] 为了获得充分完全的燃烧，你需要尽可能多地获得燃料的表面积。）对应 item A 和 item B 的 text ，所以 item A 和 item B 中的 text 保存不变，且都使用translated 字段保存这条译文。如下：
item A = {
  "position": 362,
  "text": "[F] In order to get full and complete combustion,",
  "translated": "[F] 为了获得充分完全的燃烧，你需要尽可能多地获得燃料的表面积。"
},
item B = {
  "position": 363,
  "text": "you need all the surface area that you can get of the fuel.",
  "translated": "[F] 为了获得充分完全的燃烧，你需要尽可能多地获得燃料的表面积。"
}



第二步：array 保存在 json 的 data 字段中 。
第三步：输出翻译结果：把 json 转换成字符串,且删除字符串中的空白字符、换行符。`;
const promtp04 = `你是一个负责翻译字幕的程序。你的任务是把字幕翻译成中文。
输入是一个 array ，每个 item 包括 position 、 text ，其中 text 表示字幕内容。
按照以下步骤: 

第一步：
把输入的 array 中的所有 text 合并成一个段落，保存在 json 的 totalText 字段中。

第二步：
把 totalText 字段中的内容翻译成中文，保存在 json 的 translated 字段中。

第三步：
基于 translated 字段内的翻译结果，重新意译。意译时务必对照 totalText 字段内的原始英文，不要添加也不要遗漏内容，并以让翻译结果通俗易懂，符合中文表达习惯。把意译结果保存在 json 的 translated_better 字段中。

第四步：
根据句意将 translated_better 字段中的意译结果拆分成多个短句。拆分时也可以参考标点符号（如句号、感叹号、问号等），但主要是根据句意拆分。保存在 json 的 translated_better_arry 字段中。 translated_better_arry 是一个 array ，其中 item 是个 object，object 的 translated 字段保存拆分出的短语。

第五步：
根据 translated_better_arry 的 item 中的短句的句意，匹配原始输入 array 的 item 中的英文内容。把匹配中的原始输入 array 的 item 保存在 translated_better_arry 的 item 的 match 字段中，match 字段是一个 array ，其中 item 与 原始输入 array 的 item 保持一致。

第四步：
输出 json。确保 json 符合如下两个要求： 1、json 只保留 translated_better_arry 字段。 2、json 需要经过压缩，只需要显示为一行，且删除空白部分。`;
const targetPromtp = promtp04;
export default async function translate(srtString, option) {
    // console.log("option: ", option)
    const model = targetModel;
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: targetPromtp,
            },
            { role: "user", content: srtString },
        ],
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        // max_tokens: 10000,
    });
    // console.log('usage: ', completion.usage, '\n', model, '\n finish_reason:', completion.choices[0].finish_reason)
    const content = completion.choices[0].message.content || '';
    // await fs.writeFile(`./translateSubtitleRst_${new Date()}.json`, content)
    const rstJson = JSON.parse(content);
    // console.log(rstJson)
    // console.log('sentencesArrayLength: ', rstJson.sentencesArray.length)
    // console.log('data length: ', rstJson.data.length)
    // console.log('///////////')
    return {
        data: content,
        model,
        usage: completion.usage,
        finish_reason: completion.choices[0].finish_reason
    };
}
const test = async () => {
    const targetFile = srtFileName.tem;
    const data = await fs.readFile(targetFile, { encoding: 'utf8' });
    const jsonChunk = JSON.parse(data);
    const pickedArr = jsonChunk.map((ele) => pick(ele, ['position', 'text']));
    translate(JSON.stringify(pickedArr), {});
};
// test()
//# sourceMappingURL=translateSubtitle.js.map