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

  /** 导航链接
   * external: 新标签打开
   * iconOnly: 仅底部小图标栏展示，不在主导航区渲染
   */
  navLinks: [
    { href: "/post", label: "Posts" },
    { href: "/memo", label: "Memos" },
    { href: "https://aiusage.liaoguoyin.com", label: "AI Usage", external: true },
    { href: "/atom.xml", label: "RSS", external: true, iconOnly: true },
    {
      href: "https://github.com/LiaoGuoYin/coin-blog",
      label: "GitHub",
      external: true,
      iconOnly: true,
    },
  ],

  /** UI 文案 */
  ui: {
    tocLabel: "Contents",
    prevPost: "Previous",
    nextPost: "Next",
    readingTime: (min: number) => `${min} min read`,
    copyButton: "Copy",
    copiedButton: "Copied",
    noPosts: "No posts yet.",
    noMemos: "No memos yet.",
    loadMore: "Load more",
    loading: "Loading",
  },

  /** 每次加载的 Memo 条数 */
  memosPerPage: 20,

  /** Memos API 地址(public memo only) */
  memosApiUrl: import.meta.env.DEV ? "/memos-api" : "https://memo.liaoguoyin.com",
};
