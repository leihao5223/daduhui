export interface GameType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface LotteryResult {
  period: string;
  date: string;
  time: string;
  numbers: {
    value: string;
    zodiac: string;
    color: 'red' | 'blue' | 'green';
  }[];
  specialNumber: {
    value: string;
    zodiac: string;
    color: 'red' | 'blue' | 'green';
  };
}

export interface BettingOption {
  id: string;
  name: string;
  odds: number;
  numbers: {
    value: string;
    color: 'red' | 'blue' | 'green';
  }[];
}

export interface BettingCategory {
  id: string;
  name: string;
  options: BettingOption[];
}
