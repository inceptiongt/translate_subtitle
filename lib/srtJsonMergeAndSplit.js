import { promises as fs } from 'fs';
import { head, slice, last, trimStart, reduce, chunk } from 'lodash-es';
import { ininSrtObj } from './srt2json.js';
const mergeAndSplit = (arr = [], option) => {
    const { splitedItemCount = arr.length, splitedStart = 0, splitedEnd = arr.length } = option;
    let rst = [];
    let tem = [];
    // 合并
    arr.forEach((element, index) => {
        tem.push(element);
        const { text } = element;
        if (text.substr(-1).match(/[\.\,\/\?\;\!\)\]]/)) {
            const obj = Object.assign({}, ininSrtObj);
            obj.position = rst.length + 1;
            const headItem = head(tem);
            obj.start = headItem.start;
            // obj.timer1 = headItem.timer1
            const lastItem = last(tem);
            obj.end = lastItem.end;
            // obj.timer2 = lastItem.timer2
            obj.text = trimStart(reduce(tem, (r, e) => `${r} ${e.text}`, ''));
            rst.push(obj);
            tem = [];
        }
    });
    // 分割
    const sliceArr = slice(rst, splitedStart, splitedEnd);
    // 拆分
    const chunkRst = chunk(sliceArr, splitedItemCount);
    return chunkRst; // 二维数组
};
export default mergeAndSplit;
const test = async () => {
    const body = await fs.readFile("./srt_json.json");
    const { content = [] } = JSON.parse(body.toString());
    const rst = mergeAndSplit(content, { splitedItemCount: 100 });
    fs.writeFile('./srt_json_merge.json', JSON.stringify({ data: rst }));
};
// test()
//# sourceMappingURL=srtJsonMergeAndSplit.js.map