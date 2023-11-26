// For Example, this is an SRT File

// 1
// 00:02:38,910 --> 00:02:40,161
// English! I'm English!

// 2
// 00:05:40,049 --> 00:05:41,801
// It's grenadiers, mate.
// After converting, the output will be

// [
//     {
//         "position": 1,
//         "start": "00:02:38,910",
//         "end": "00:02:40,161",
//         "text": "English! I'm English!"
//     },
//     {
//         "position": 2,
//         "start": "00:05:40,049",
//         "end": "00:05:41,801",
//         "text": "It's grenadiers, mate."
//     },
// ]

import { promises as fs } from 'fs';

export type srtObjType = {
    position: number,
    start: string,
    end: string,
    /**
     * 英文内容
     */
    text: string
}

export const ininSrtObj: srtObjType = {
    position: 0,
    start: '',
    end: '',
    text: ''
}

export default function srt2json (string: string) {
    try {
        let content: srtObjType[] = [];
        let data = string.split("\n");
        if (data[-1] !== ''){data.push('')}

        let i = 0;
        var obj = Object.assign({}, ininSrtObj)
        // console.log(data.length);
        while (i < data.length) {
            let line = data[i];
            if (line === '') {
                // i += 1;
                content.push(obj);
                obj = Object.assign({}, ininSrtObj);
            } else if (Number.isInteger(parseInt(line)) && !line.includes("-->")) {
                obj.position = parseInt(line);
                // i = i + 1;
            } else if (line.includes("--")) {
                let part = line.split("-->");
                let start = part[0].split(",")[0].trim();
                let timer1 = part[0].split(",")[1].trim();
                let end = part[1].split(",")[0].trim();
                let timer2 = part[1].split(",")[1].replace("\r", "").trim();
                obj.start = `${start},${timer1}`;
                // obj.timer1 = ;
                obj.end = `${end},${timer2}`;
                // obj.timer2 = ;
                // i = i + 1;
            } else if (line.match("[a-z|A-Z]")) {
                if (line.includes("i>")) {
                    line = line.replace("<i>", "");
                    line = line.replace("</i>", "");
                }
                obj.text = line;
                // i = i + 1;
            }
            i += 1
        }
        // fs.writeFile("subtitle.json", JSON.stringify(content), function () {
        //   console.log("Wriiten");
        // });
        return {
            content,
            length: content.length,
            maxPosition: content[content.length - 1].position,
            isValidate: content.length === content[content.length - 1].position
        }
    } catch (err) {
        console.log(err)
        throw err
    }

}

const test = async () => {
    const body = await fs.readFile("/Users/gt/Downloads/cut-How Does A Carburetor Work_ _ Transparent Carburetor at 28,546 fps Slow Mo - Smarter Every Day 259 - 英语.srt")
    const content = await srt2json(body.toString())
    fs.writeFile('./srt_json.json',JSON.stringify(content))
}

// test()

