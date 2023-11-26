# translate_subtitle
通过 openAI 翻译英文字幕
# 使用
- 在 .env 中设置 openAI apikey、网络代理
- 在 config.json 中设置源 srt 的文件路径等
# 实现
- 把 srt 文件转换成 json
- 合并字幕 item，把生硬截断的句子合并。
- json 瘦身，不要时间戳，节约 token。
- json 分割，按 70 个字幕 item 分割成多个 json，用于调用 openAI api。否则会超出 complete_token 限制（4096）。
- waterfall 的方式调用 api，判断 response，不符合格式则中断 waterfall。
- json 组合，组合中文结果、时间戳。
- 转换为 srt 文件。
# TODO
- api 调用失败后支持重试
- 更友好的 console，比如添加 spin、select option 等。
