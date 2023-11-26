import { optionType } from './srtJsonMergeAndSplit.js'
/**
 * 
 */

const models = {
  gtp3_5_1106: 'gpt-3.5-turbo-1106',
  gtp4_1106: 'gpt-4-1106-preview'
}
export const model = models.gtp4_1106

const getPricing = (m: string) => {
  if (m === 'gpt-3.5-turbo-1106') {
    return {
      in: 0.001,
      out: 0.002
    }
  } else if (m === 'gpt-4-1106-preview') {
    return {
      in: 0.01,
      out: 0.02
    }
  }
  return {
    in: 0,
    out: 0
  }
}

export const pricing = getPricing(model)

export const proxy = "http://127.0.0.1:8889"

/**
 * 字幕切割配置
 * 
 */
export const splitOptions: optionType = {
  splitedItemCount: 70,
  splitedStart: 350,
  splitedEnd: 420
}