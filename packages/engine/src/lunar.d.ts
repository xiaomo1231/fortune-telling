// lunar-javascript 没有自带类型，这里只声明用到的部分。
declare module "lunar-javascript" {
  export interface LiuNian { getYear(): number; getAge(): number; getGanZhi(): string; }
  export interface DaYun {
    getStartYear(): number; getEndYear(): number; getStartAge(): number; getEndAge(): number;
    getGanZhi(): string; getIndex(): number; getLiuNian(n?: number): LiuNian[];
  }
  export interface Yun {
    getStartYear(): number; getStartMonth(): number; getStartDay(): number; getStartHour(): number;
    isForward(): boolean; getDaYun(n?: number): DaYun[]; getStartSolar(): Solar;
  }
  export interface EightChar {
    setSect(sect: number): void;
    getYear(): string; getMonth(): string; getDay(): string; getTime(): string;
    getYearGan(): string; getYearZhi(): string; getMonthGan(): string; getMonthZhi(): string;
    getDayGan(): string; getDayZhi(): string; getTimeGan(): string; getTimeZhi(): string;
    getYearHideGan(): string[]; getMonthHideGan(): string[]; getDayHideGan(): string[]; getTimeHideGan(): string[];
    getYearNaYin(): string; getMonthNaYin(): string; getDayNaYin(): string; getTimeNaYin(): string;
    getYearDiShi(): string; getMonthDiShi(): string; getDayDiShi(): string; getTimeDiShi(): string;
    getTaiYuan(): string; getMingGong(): string; getShenGong(): string;
    getYun(gender: number, sect?: number): Yun;
  }
  export interface JieQi { getName(): string; getSolar(): Solar; }
  export interface Lunar {
    getYear(): number; getMonth(): number; getDay(): number;
    getYearInChinese(): string; getMonthInChinese(): string; getDayInChinese(): string;
    getYearInGanZhi(): string; getMonthInGanZhi(): string; getDayInGanZhi(): string; getTimeInGanZhi(): string;
    getYearInGanZhiExact(): string; getMonthInGanZhiExact(): string; getDayInGanZhiExact(): string;
    getDayGan(): string; getDayZhi(): string; getDayGanExact(): string; getDayZhiExact(): string;
    getTimeZhi(): string; getEightChar(): EightChar;
    getDayYi(): string[]; getDayJi(): string[]; getDayChongDesc(): string; getDaySha(): string;
    getJieQi(): string; getPrevJieQi(wholeDay?: boolean): JieQi; getNextJieQi(wholeDay?: boolean): JieQi;
    getYearShengXiao(): string; getSolar(): Solar;
  }
  export interface Solar {
    getYear(): number; getMonth(): number; getDay(): number; getHour(): number; getMinute(): number;
    getLunar(): Lunar; toYmd(): string; toYmdHms(): string; getWeek(): number;
  }
  export const Solar: {
    fromYmd(y: number, m: number, d: number): Solar;
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    fromDate(d: Date): Solar;
  };
  export const Lunar: {
    fromYmd(y: number, m: number, d: number): Lunar;
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
  };
}
