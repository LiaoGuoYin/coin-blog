export const siteConfig = {
  /** 站点名称 */
  title: "Coin's Blog",

  /** 站点描述（用于 meta description） */
  description: "A personal blog by coin",

  /** 作者名 */
  author: "coin",

  /** 站点部署 URL（用于 RSS feed 等） */
  url: "https://liaoguoyin.com",

  /** 站点语言 */
  lang: "zh-CN",

  /** 头像路径（放在 public 目录下） */
  avatar: "/avatar.png",

  /** 导航链接 */
  navLinks: [
    { href: "/post", label: "Post" },
    { href: "/memo", label: "Memo" },
    { href: "/atom.xml", label: "RSS", external: true },
    { href: "https://github.com/LiaoGuoYin/coin-blog", label: "GitHub", external: true },
  ],

  /** UI 文案 */
  ui: {
    tocLabel: "本文导览",
    prevPost: "← 上一篇",
    nextPost: "下一篇 →",
    backToTop: "返回顶部",
    readingTime: (min: number) => `约 ${min} 分钟`,
    copyButton: "复制",
    copiedButton: "已复制",
    noPosts: "No posts yet.",
    noMemos: "No memos yet.",
    postsHeading: "Posts",
    allPostsHeading: "All Posts",
    memosHeading: "Memos",
  },

  /**
   * Post 列表展示风格
   * - 'divided'   : 分隔行列表 — 标题左、日期右，底部细线分隔，hover 背景微变
   * - 'twoLine'   : 双行条目 — 标题一行 + 日期/阅读时间一行，靠间距区分
   * - 'preview'   : 带摘要预览 — 标题 + 日期 + 正文前80字摘要
   */
  postListStyle: "twoLine" as "divided" | "twoLine" | "preview",

  /** Memos API 地址(public memo only) */
  memosApiUrl: "https://memo.nas.hz.moyumomokan.cn",
};
