/** 顶栏、底栏等壳层 copy */
export const layoutContent = {
  brandName: '大都汇',
  logoAlt: '大都汇',
  login: '登录',
  register: '注册',
  headerUserId: '客户号',
  headerBalance: '余额',
  headerUserLoading: '加载中…',
  headerTabs: [
    { id: 'home', label: '首页', icon: 'fa-home' as const, path: '/' },
    { id: 'recharge', label: '充值', icon: 'fa-wallet' as const, path: '/deposit' },
    { id: 'sports', label: '体育', icon: 'fa-futbol' as const, path: '/sports' },
  ],
  agentCenter: '代理中心',
  contactSupport: '联系客服',
  bottomTabs: [
    { to: '/', label: '主页', end: true as const },
    { to: '/deposit', label: '充值', end: false as const },
    { to: '/activity', label: '活动', end: false as const },
    { to: '/profile', label: '个人中心', end: false as const },
  ],
  footerPaymentLabel: '支持支付方式：',
} as const;
