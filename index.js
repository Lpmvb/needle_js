const { cv, cvTranslateError } = require('opencv-wasm');
const Jimp = require('jimp').Jimp;

/**
 * 模板匹配选项
 * @typedef {Object} MatchOptions
 * @property {number} [threshold=0.8] - 匹配阈值
 * @property {number} [scale=1.0] - 缩放比例
 */

/**
 * 匹配结果
 * @typedef {Object} MatchResult
 * @property {boolean} found - 是否找到匹配
 * @property {number|null} x - 匹配位置的x坐标
 * @property {number|null} y - 匹配位置的y坐标
 * @property {number} confidence - 匹配置信度
 */

/**
 * 执行模板匹配
 * @param {Buffer} haystackBuffer -大图的Buffer数据
 * @param {Buffer} needleBuffer - 模板图的Buffer数据
 * @param {MatchOptions} [options] - 匹配选项
 * @returns {Promise<MatchResult>} 匹配结果
 */
async function templateMatch(haystackBuffer, needleBuffer, options = {}) {
  try {
    const threshold = options.threshold || 0.8;
    const scale = options.scale || 1.0;

    const haystackImage = await Jimp.read(haystackBuffer);
    const needleImage = await Jimp.read(needleBuffer);

    let haystack = cv.matFromImageData(haystackImage.bitmap);
    let needle = cv.matFromImageData(needleImage.bitmap);

    if (haystack.empty() || needle.empty()) {
      haystack.delete();
      needle.delete();
      throw new Error('图片数据为空');
    }

    const haystackSize = { width: haystack.cols, height: haystack.rows };

    let resizedNeedle = needle;
    if (scale !== 1.0) {
      resizedNeedle = new cv.Mat();
      const newSize = new cv.Size(
        Math.round(needle.cols * scale),
        Math.round(needle.rows * scale)
      );
      cv.resize(needle, resizedNeedle, newSize, 0, 0, cv.INTER_LINEAR);
      needle.delete();
    }

    const needleSize = { width: resizedNeedle.cols, height: resizedNeedle.rows };

    if (haystackSize.width < needleSize.width || haystackSize.height < needleSize.height) {
      haystack.delete();
      resizedNeedle.delete();
      throw new Error('模板图尺寸大于大图，无法匹配');
    }

    let result = new cv.Mat();
    let mask = new cv.Mat();

    cv.matchTemplate(haystack, resizedNeedle, result, cv.TM_CCOEFF_NORMED, mask);

    const minMax = cv.minMaxLoc(result, mask);
    const maxVal = minMax.maxVal;
    const maxLoc = minMax.maxLoc;

    const matched = maxVal >= threshold;

    haystack.delete();
    if (resizedNeedle !== needle) {
      resizedNeedle.delete();
    }
    result.delete();
    mask.delete();

    return {
      found: matched,
      x: matched ? maxLoc.x : null,
      y: matched ? maxLoc.y : null,
      confidence: maxVal
    };

  } catch (err) {
    throw new Error(`模板匹配失败: ${cvTranslateError(cv, err) || err.message}`);
  }
}

module.exports = {
  templateMatch
};
