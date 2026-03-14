export const siteConfig = {
  /**
   * Post 列表展示风格
   * - 'divided'   : 分隔行列表 — 标题左、日期右，底部细线分隔，hover 背景微变
   * - 'twoLine'   : 双行条目 — 标题一行 + 日期/阅读时间一行，靠间距区分
   * - 'preview'   : 带摘要预览 — 标题 + 日期 + 正文前80字摘要
   */
  postListStyle: "twoLine" as "divided" | "twoLine" | "preview",
};
