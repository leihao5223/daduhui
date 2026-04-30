import React from 'react';
import { Volume2 } from 'lucide-react';

const notices = [
  '系统公告：新澳门六合彩第2026046期即将开奖',
  '恭喜用户138****8888中奖￥88,888',
  '香港六合彩开奖时间：每周二、四、六 21:30',
];

export default function NoticeBar() {
  return (
    <div className="bg-gradient-to-r from-amber-900 to-amber-800 px-4 py-2 flex items-center gap-3">
      <Volume2 className="w-4 h-4 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-sm text-amber-100">
          {notices.join('  |  ')}
        </div>
      </div>
    </div>
  );
}
