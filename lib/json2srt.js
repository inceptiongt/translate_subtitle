import { promises as fs } from 'fs';
const json2srtDouble = (data) => {
    const rst = [];
    data.forEach(element => {
        rst.push(element.position, `${element.start} --> ${element.end}`, element.translated, element.text, '');
    });
    return rst.join('\n');
};
export { json2srtDouble };
const test = async () => {
    const body = await fs.readFile("./rst_translated.json");
    const data = JSON.parse(body.toString());
    const content = await json2srtDouble(data);
    fs.writeFile('./rst_translated.srt', content);
};
// test()
//# sourceMappingURL=json2srt.js.map