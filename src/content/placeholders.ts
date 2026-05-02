export type PlaceholderPageKey = 'sports' | 'support' | 'forgotPassword';

export const placeholderContent: Record<
  PlaceholderPageKey,
  { title: string; description: string }
> = {
  sports: {
    title: '体育中心',
    description: '足球、篮球与电竞赛事将陆续接入，敬请期待。',
  },
  support: {
    title: '联系客服',
    description: '如需帮助，请返回首页点击「联系客服」或底部在线入口。',
  },
  forgotPassword: {
    title: '找回密码',
    description: '该功能即将开放，请先使用在线客服协助处理。',
  },
} as const;
