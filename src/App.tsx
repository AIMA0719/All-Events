import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, Search, Users, LayoutGrid, ChevronLeft, ChevronRight, MapPin, Globe, Sparkles, Tag, ArrowUpRight, Clock, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Event {
  id: string;
  month: string;
  title: string;
  url: string;
  tags: string[];
  organizer: string;
  date: string;
  startDate: Date | null;
  endDate: Date | null;
  categories: string[];
}

const EVENT_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-pink-100 text-pink-700 border-pink-200',
];

const getEventColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
};

const CATEGORIES = ['전체', '개발', 'AI', '마케팅', '전시', '서브 컬쳐'];

const CalendarView = ({ events }: { events: Event[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
    >
      <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{format(currentDate, 'yyyy년 MM월')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-10 w-10 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900"><ChevronLeft className="h-4 w-4"/></Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-10 w-10 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900"><ChevronRight className="h-4 w-4"/></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`py-4 text-center text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-slate-100 gap-[1px]">
        {weeks.map((week, weekIdx) => {
          const weekStart = week[0];
          const weekEnd = week[6];
          
          const weekEvents = events.filter(e => 
            e.startDate && e.endDate && 
            startOfDay(e.startDate) <= endOfDay(weekEnd) && 
            startOfDay(e.endDate) >= startOfDay(weekStart)
          );
          
          weekEvents.sort((a, b) => {
            const aStart = Math.max(a.startDate!.getTime(), weekStart.getTime());
            const bStart = Math.max(b.startDate!.getTime(), weekStart.getTime());
            if (aStart !== bStart) return aStart - bStart;
            const aLen = a.endDate!.getTime() - a.startDate!.getTime();
            const bLen = b.endDate!.getTime() - b.startDate!.getTime();
            return bLen - aLen;
          });

          const slots: Event[][] = [];
          const eventSlots = new Map<string, number>();

          weekEvents.forEach(event => {
            let slot = 0;
            while (true) {
              const conflict = slots[slot]?.some(e => {
                const eStart = Math.max(e.startDate!.getTime(), weekStart.getTime());
                const eEnd = Math.min(e.endDate!.getTime(), weekEnd.getTime());
                const evStart = Math.max(event.startDate!.getTime(), weekStart.getTime());
                const evEnd = Math.min(event.endDate!.getTime(), weekEnd.getTime());
                return eStart <= evEnd && eEnd >= evStart;
              });
              if (!conflict) {
                if (!slots[slot]) slots[slot] = [];
                slots[slot].push(event);
                eventSlots.set(event.id, slot);
                break;
              }
              slot++;
            }
          });

          const minHeight = 140;
          const requiredHeight = Math.max(minHeight, (slots.length * 28) + 48);

          return (
            <div key={weekIdx} className="relative grid grid-cols-7 bg-white" style={{ minHeight: `${requiredHeight}px` }}>
              {week.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSunday = day.getDay() === 0;
                const isSaturday = day.getDay() === 6;

                return (
                  <div key={day.toString()} className={`border-r border-slate-100 p-3 ${!isCurrentMonth ? 'bg-slate-50/30 opacity-40' : ''} ${dayIdx === 6 ? 'border-r-0' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-slate-900 text-white shadow-md' :
                          isSunday ? 'text-rose-500' :
                          isSaturday ? 'text-blue-500' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              <div className="absolute top-12 left-0 right-0 bottom-0 pointer-events-none">
                {weekEvents.map(event => {
                  const slot = eventSlots.get(event.id) || 0;
                  const startIdx = Math.max(0, differenceInCalendarDays(startOfDay(event.startDate!), startOfDay(weekStart)));
                  const endIdx = Math.min(6, differenceInCalendarDays(startOfDay(event.endDate!), startOfDay(weekStart)));
                  const span = endIdx - startIdx + 1;
                  
                  const isStart = startOfDay(event.startDate!) >= startOfDay(weekStart);
                  const isEnd = startOfDay(event.endDate!) <= startOfDay(weekEnd);

                  return (
                    <div 
                      key={event.id}
                      className="absolute px-1 pointer-events-auto"
                      style={{
                        top: `${slot * 28}px`,
                        left: `${(startIdx / 7) * 100}%`,
                        width: `${(span / 7) * 100}%`,
                        height: '26px',
                        zIndex: 10
                      }}
                    >
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`block w-full h-full text-xs px-2.5 leading-[24px] truncate transition-all hover:brightness-95 border font-semibold shadow-sm
                          ${getEventColor(event.id)}
                          ${isStart ? 'rounded-l-md ml-1' : '-ml-1 border-l-0'}
                          ${isEnd ? 'rounded-r-md mr-1' : '-mr-1 border-r-0'}
                        `}
                        title={event.title}
                      >
                        {event.title}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [viewMode, setViewMode] = useState<string>('grid');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [devResponse, marketingResponse, exhibitionResponse] = await Promise.all([
          fetch('https://raw.githubusercontent.com/brave-people/Dev-Event/master/README.md'),
          fetch('/api/events/marketing').catch(() => null),
          fetch('/data_exhibition.json').catch(() => null)
        ]);
        
        if (!devResponse.ok) {
          throw new Error('Failed to fetch dev data');
        }
        
        const text = await devResponse.text();
        const parsedEvents = parseMarkdown(text);
        
        // 카테고리 자동 분류 (개발, AI)
        const categorizedDevEvents = parsedEvents.map(event => {
          const categories = ['개발'];
          const aiKeywords = ['AI', '인공지능', '머신러닝', '딥러닝', 'LLM', '데이터'];
          
          if (event.tags.some(t => aiKeywords.some(kw => t.toUpperCase().includes(kw))) || 
              aiKeywords.some(kw => event.title.toUpperCase().includes(kw))) {
            categories.push('AI');
          }
          
          return { ...event, categories };
        });

        let marketingEvents: Event[] = [];
        if (marketingResponse && marketingResponse.ok) {
          try {
            const mData = await marketingResponse.json();
            const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0') + '월';
            
            marketingEvents = mData.map((m: any) => ({
              id: m.id,
              month: currentMonthStr,
              title: m.title,
              url: m.url,
              tags: ['마케팅', '세미나/교육'],
              organizer: m.source,
              date: '상시 확인',
              startDate: new Date(), // Use today for sorting purposes
              endDate: new Date(),
              categories: ['마케팅']
            }));
          } catch (e) {
            console.error("Failed to parse marketing events", e);
          }
        }

        let exhibitionEvents: Event[] = [];
        if (exhibitionResponse && exhibitionResponse.ok) {
          try {
            const eData = await exhibitionResponse.json();
            exhibitionEvents = eData.map((e: any) => {
              const categories = ['전시'];
              
              const titleUpper = e.title.toUpperCase();

              // 서브 컬쳐 분류
              const subcultureKeywords = ['게임', '코믹', '애니', '일러스트', '팝컬쳐', '서브컬쳐', '플레이엑스포', '서코', '부코', '코스프레', '보드게임', '캐릭터', '굿즈', '피규어', '웹툰', '만화', 'AGF', '디페스타', '일러스타', '콘서트', 'LIVE', '투어', '캣쇼', '펫쇼', '페스티벌', '문화행사'];
              if (subcultureKeywords.some(kw => titleUpper.includes(kw.toUpperCase()))) {
                categories.push('서브 컬쳐');
              }

              // 개발 분류 (IT, 소프트웨어 등)
              const devKeywords = ['IT', '소프트웨어', '개발', '해커톤', '보안', '클라우드', '데이터', '테크', 'TECH'];
              if (devKeywords.some(kw => titleUpper.includes(kw.toUpperCase()))) {
                categories.push('개발');
              }

              // AI 분류
              const aiKeywords = ['AI', '인공지능', '머신러닝', '딥러닝', 'LLM'];
              if (aiKeywords.some(kw => titleUpper.includes(kw.toUpperCase()))) {
                categories.push('AI');
              }

              // 마케팅 분류
              const marketingKeywords = ['마케팅', '광고', '홍보', '이커머스', '콘텐츠', '트렌드'];
              if (marketingKeywords.some(kw => titleUpper.includes(kw.toUpperCase()))) {
                categories.push('마케팅');
              }

              return {
                id: `exh-${Math.random().toString(36).substr(2, 9)}`,
                month: e.start_date ? `${e.start_date.substring(5, 7)}월` : '미정',
                title: e.title,
                url: e.link,
                tags: ['전시', e.source === 'coex' ? '코엑스' : '킨텍스'],
                organizer: e.source === 'coex' ? 'COEX' : 'KINTEX',
                date: `${e.start_date} ~ ${e.end_date}`,
                startDate: new Date(e.start_date),
                endDate: new Date(e.end_date),
                categories: categories
              };
            });
          } catch (e) {
            console.error("Failed to parse exhibition events", e);
          }
        }

        // 날짜순 정렬
        const allEvents = [...categorizedDevEvents, ...marketingEvents, ...exhibitionEvents].sort((a, b) => {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return a.startDate.getTime() - b.startDate.getTime();
        });

        setEvents(allEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const parseMarkdown = (markdown: string): Omit<Event, 'categories'>[] => {
    const lines = markdown.split('\n');
    const parsedEvents: Omit<Event, 'categories'>[] = [];
    let currentMonth = '';
    let sectionYear = new Date().getFullYear();
    let sectionMonth = new Date().getMonth() + 1;
    let currentEvent: Partial<Event> | null = null;

    const pushCurrentEvent = () => {
      if (currentEvent && currentEvent.title) {
        if (currentEvent.date) {
          const dateMatches = [...currentEvent.date.matchAll(/(\d{1,2})\.\s*(\d{1,2})/g)];
          if (dateMatches.length > 0) {
            const startMonth = parseInt(dateMatches[0][1], 10);
            const startDay = parseInt(dateMatches[0][2], 10);
            let startYear = sectionYear;
            if (startMonth > sectionMonth + 1) startYear = sectionYear - 1;
            currentEvent.startDate = new Date(startYear, startMonth - 1, startDay);

            if (dateMatches.length > 1) {
              const endMonth = parseInt(dateMatches[1][1], 10);
              const endDay = parseInt(dateMatches[1][2], 10);
              let endYear = startYear;
              if (endMonth < startMonth) endYear = startYear + 1;
              currentEvent.endDate = new Date(endYear, endMonth - 1, endDay);
            } else {
              currentEvent.endDate = currentEvent.startDate;
            }
          } else {
            currentEvent.startDate = null;
            currentEvent.endDate = null;
          }
        }
        parsedEvents.push(currentEvent as Omit<Event, 'categories'>);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const monthMatch = line.match(/^## `?(\d{2})년 (\d{2})월`?/);
      if (monthMatch) {
        sectionYear = 2000 + parseInt(monthMatch[1], 10);
        sectionMonth = parseInt(monthMatch[2], 10);
        currentMonth = monthMatch[0].replace(/#/g, '').replace(/`/g, '').trim();
        continue;
      }
      
      if (line.match(/^## 지난 행사 기록/) || line.match(/^## 개발자 동아리/)) {
        break;
      }

      const titleMatch = line.match(/^- (?:__|[*]{2})?\[(.*?)\]\((.*?)\)(?:__|[*]{2})?/);
      if (titleMatch) {
        pushCurrentEvent();
        currentEvent = {
          id: Math.random().toString(36).substr(2, 9),
          month: currentMonth,
          title: titleMatch[1],
          url: titleMatch[2],
          tags: [],
          organizer: '',
          date: '',
          startDate: null,
          endDate: null
        };
        continue;
      }
      
      if (currentEvent) {
        if (line.startsWith('- 분류:')) {
          const tagsStr = line.replace('- 분류:', '').trim();
          const tags = [...tagsStr.matchAll(/`(.*?)`/g)].map(m => m[1]);
          currentEvent.tags = tags;
        } else if (line.startsWith('- 주최:')) {
          currentEvent.organizer = line.replace('- 주최:', '').replace(/`/g, '').trim();
        } else if (line.startsWith('- 접수:')) {
          currentEvent.date = line.replace('- 접수:', '').replace(/`/g, '').trim();
        } else if (line.startsWith('- 일시:')) {
          if (!currentEvent.date) {
            currentEvent.date = line.replace('- 일시:', '').replace(/`/g, '').trim();
          }
        }
      }
    }
    
    pushCurrentEvent();
    return parsedEvents;
  };

  const months = ['all', ...Array.from(new Set(events.map(e => e.month)))].filter(Boolean);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMonth = selectedMonth === 'all' || event.month === selectedMonth;
    const matchesCategory = selectedCategory === '전체' || event.categories.includes(selectedCategory);
    
    return matchesSearch && matchesMonth && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-white border-b border-slate-200 pt-20 pb-16 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium mb-6 border border-slate-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>매일 업데이트되는 최신 행사 일정</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              All Events
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              개발, AI, 마케팅, 전시 분야의 컨퍼런스, 해커톤, 웨비나 일정을 한눈에 확인하고<br className="hidden md:block" />
              새로운 성장의 기회를 발견하세요.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Sticky Controls Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-4">
          
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex h-12 bg-slate-100/80 p-1 rounded-xl">
                <TabsTrigger value="grid" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><LayoutGrid className="w-4 h-4"/> 카드 뷰</TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"><Calendar className="w-4 h-4"/> 캘린더 뷰</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="행사명, 주최, 태그 검색..." 
                  className="pl-11 h-12 w-full bg-white border-slate-200 shadow-sm focus-visible:ring-slate-900 rounded-xl text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-40 h-12 bg-white border-slate-200 shadow-sm focus:ring-slate-900 rounded-xl font-medium text-base">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {months.map(month => (
                    <SelectItem key={month} value={month} className="font-medium">
                      {month === 'all' ? '전체 일정' : month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-5">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-slate-900 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-slate-400 animate-spin opacity-70" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
            </div>
            <p className="text-slate-500 font-medium animate-pulse">행사 데이터를 실시간으로 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg font-bold mb-2">데이터를 불러오는데 실패했습니다</p>
            <p className="text-red-500/80">{error}</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
              <>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index < 12 ? index * 0.05 : 0 }}
                      key={event.id}
                      className="h-full"
                    >
                      <Card className="group relative flex flex-col h-full bg-white rounded-3xl border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden">
                        <div className="p-6 lg:p-8 flex-grow flex flex-col">
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex gap-2 flex-wrap">
                              {event.categories.map(cat => (
                                <Badge key={cat} variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800 border-none font-semibold px-3 py-1 rounded-full">
                                  {cat}
                                </Badge>
                              ))}
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-semibold px-3 py-1 rounded-full">
                                {event.month}
                              </Badge>
                            </div>
                            {event.date && (
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                                <Clock className="w-3.5 h-3.5" />
                                {event.date}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 flex items-start gap-2">
                              {event.title}
                              <ArrowUpRight className="w-5 h-5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-blue-600 flex-shrink-0 mt-1" />
                            </a>
                          </h3>
                          <div className="mt-auto flex flex-col gap-3 text-slate-600 text-sm font-medium">
                            {event.organizer && (
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate text-slate-700">{event.organizer}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-4 w-4 text-slate-500" />
                              </div>
                              <span className="truncate text-slate-700">
                                {(() => {
                                  const locationTags = event.tags.filter(t => t.includes('온라인') || t.includes('오프라인') || ['서울', '부산', '제주', '경기', '인천', '대전', '대구', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '세종', '코엑스', '킨텍스', 'DDP', 'BEXCO'].some(loc => t.includes(loc)));
                                  return locationTags.length > 0 ? locationTags.join(', ') : '장소 미상';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 lg:px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
                          {event.tags.map((tag, idx) => {
                            const isOnline = tag.includes('온라인');
                            const isOffline = tag.includes('오프라인');
                            const isFree = tag.includes('무료');
                            const isPaid = tag.includes('유료');
                            
                            let badgeClass = "bg-white text-slate-600 border-slate-200";
                            let Icon = Tag;
                            
                            if (isOnline) {
                              badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
                              Icon = Globe;
                            } else if (isOffline) {
                              badgeClass = "bg-orange-50 text-orange-700 border-orange-200/60";
                              Icon = MapPin;
                            } else if (isFree) {
                              badgeClass = "bg-blue-50 text-blue-700 border-blue-200/60";
                            } else if (isPaid) {
                              badgeClass = "bg-rose-50 text-rose-700 border-rose-200/60";
                            }

                            return (
                              <Badge key={idx} variant="outline" className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${badgeClass}`}>
                                {(isOnline || isOffline) && <Icon className="w-3 h-3" /> }
                                {tag}
                              </Badge>
                            );
                          })}
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-700 text-xl font-bold">조건에 맞는 행사가 없습니다.</p>
                    <p className="text-slate-500 mt-2">검색어나 월 필터를 변경해보세요.</p>
                    <Button 
                      variant="outline" 
                      className="mt-6 rounded-full border-slate-200 hover:bg-slate-50"
                      onClick={() => { setSearchQuery(''); setSelectedMonth('all'); setSelectedCategory('전체'); }}
                    >
                      필터 초기화
                    </Button>
                  </motion.div>
                )}
              </>
            </div>
          ) : (
            <CalendarView events={filteredEvents} />
          )
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-300" />
          </div>
          <p className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-600 font-medium">
            <span>개발 행사 데이터 출처:</span>
            <a href="https://github.com/brave-people/Dev-Event" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:text-blue-600 transition-colors flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              brave-people/Dev-Event
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
          <p className="mt-4 text-slate-400 max-w-md mx-auto leading-relaxed">
            개발 분야는 위 오픈소스 저장소의 데이터를 실시간으로 파싱하여 제공되며,<br/>
            마케팅 분야는 아이보스(i-boss)를 실시간 스크래핑, 전시 분야는 자동화 봇을 통해 업데이트됩니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
