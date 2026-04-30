import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

const playTypes = [
  { id: 'tema', name: '特码', subTypes: ['特码A', '特码B'] },
  { id: 'tema2', name: '特码两面', subTypes: [] },
  { id: 'tema3', name: '特码头尾数', subTypes: [] },
  { id: 'bose', name: '色波半波', subTypes: [] },
  { id: 'shengxiao', name: '十二生肖', subTypes: [] },
  { id: 'hexiao', name: '合肖', subTypes: [] },
  { id: 'wuxing', name: '五行', subTypes: [] },
  { id: 'zhengma', name: '正码', subTypes: ['正码A', '正码B'] },
  { id: 'zhengma2', name: '正码特', subTypes: [] },
  { id: 'zhengma3', name: '正码1-6', subTypes: [] },
  { id: 'weishu', name: '一肖尾数', subTypes: [] },
  { id: 'zongxiao', name: '总肖', subTypes: [] },
  { id: 'qisebo', name: '七色波', subTypes: [] },
];

const numbers = Array.from({ length: 49 }, (_, i) => i + 1);

const getColor = (num: number): 'red' | 'blue' | 'green' => {
  const red = [1,2,7,8,12,13,18,19,23,24,29,30,34,35,40,45,46];
  const blue = [3,4,9,10,14,15,20,25,26,31,36,37,41,42,47,48];
  if (red.includes(num)) return 'red';
  if (blue.includes(num)) return 'blue';
  return 'green';
};

const colorClass = {
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600'
};

const zodiacMap = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const getZodiac = (num: number) => zodiacMap[(num - 1) % 12];

export default function BettingPanel() {
  const [activeTab, setActiveTab] = useState('tema');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<string[]>(['tema']);
  const [showSubTypes, setShowSubTypes] = useState(false);

  const toggleNumber = (num: number) => {
    setSelectedNumbers(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleTypeExpand = (typeId: string) => {
    setExpandedTypes(prev => 
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  const currentType = playTypes.find(t => t.id === activeTab);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header - 类型选择 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">类型</span>
          <button 
            onClick={() => setShowSubTypes(!showSubTypes)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-primary-500 transition-colors"
          >
            {currentType?.name}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">特码</span>
          <button className="p-1.5 text-slate-400 hover:text-primary-600">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-primary-600">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Play Types List */}
      <AnimatePresence>
        {showSubTypes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-100 overflow-hidden"
          >
            <div className="p-2 grid grid-cols-3 gap-2 bg-slate-50">
              {playTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveTab(type.id);
                    setShowSubTypes(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === type.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-primary-50 border border-slate-200'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Numbers Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {numbers.map((num) => {
            const color = getColor(num);
            const isSelected = selectedNumbers.includes(num);
            return (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleNumber(num)}
                className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary-500 ring-offset-2' 
                    : ''
                }`}
              >
                <div className={`w-full h-full rounded-full ${colorClass[color]} flex flex-col items-center justify-center text-white shadow-md`}>
                  <span className="text-sm font-bold">{num.toString().padStart(2, '0')}</span>
                </div>
                <span className="absolute -bottom-4 text-[10px] text-slate-500">48.26倍</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-600">
            已选: <span className="font-semibold text-primary-600">{selectedNumbers.length}</span> 个
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedNumbers([])}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              清空
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all">
              确认投注
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
