import json
import os
from playwright.sync_api import sync_playwright
from datetime import datetime

def scrape_exhibitions():
    events = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. COEX 스크래핑
        try:
            print("Scraping COEX...")
            page.goto("https://www.coex.co.kr/event/full-schedules/", timeout=60000)
            page.wait_for_load_state("networkidle")
            
            # 코엑스는 보통 달력 형태나 리스트 형태로 모든 행사를 보여줍니다.
            # 개발/AI가 아니더라도 '모든' 행사를 무조건 수집합니다.
            items = page.query_selector_all("a")
            for item in items:
                title = item.inner_text().strip()
                link = item.get_attribute("href")
                
                # 제목이 있고, 행사 상세 페이지 링크인 경우 모두 수집 (필터링 최소화)
                if title and link and ("/event/" in link or "exhibition" in link.lower()):
                    events.append({
                        "title": f"[코엑스 전시] {title.replace(chr(10), ' ')}",
                        "link": link if link.startswith("http") else f"https://www.coex.co.kr{link}",
                        "start_date": datetime.now().strftime("%Y-%m-%d"), # 실제 파싱 로직 적용 필요
                        "end_date": datetime.now().strftime("%Y-%m-%d"),
                        "source": "coex"
                    })
        except Exception as e:
            print(f"COEX scraping failed: {e}")

        # 2. KINTEX 스크래핑
        try:
            print("Scraping KINTEX...")
            page.goto("https://www.kintex.com/web/ko/event/list.do", timeout=60000)
            page.wait_for_load_state("networkidle")
            
            # 킨텍스 역시 모든 행사를 무조건 수집합니다.
            items = page.query_selector_all("a")
            for item in items:
                title = item.inner_text().strip()
                link = item.get_attribute("href")
                
                if title and link and ("event/view" in link or "exhibition" in link.lower()):
                    events.append({
                        "title": f"[킨텍스 전시] {title.replace(chr(10), ' ')}",
                        "link": link if link.startswith("http") else f"https://www.kintex.com{link}",
                        "start_date": datetime.now().strftime("%Y-%m-%d"), # 실제 파싱 로직 적용 필요
                        "end_date": datetime.now().strftime("%Y-%m-%d"),
                        "source": "kintex"
                    })
        except Exception as e:
            print(f"KINTEX scraping failed: {e}")
            
        browser.close()
        
    return events

if __name__ == "__main__":
    data = scrape_exhibitions()
    
    # 만약 스크래핑된 데이터가 없다면 빈 리스트 저장
    if not data:
        print("No data scraped. Saving empty list.")
        data = []
        
    # public 폴더에 JSON 저장 (React 앱에서 fetch 가능하도록)
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'data_exhibition.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(data)} events to {output_path}")
