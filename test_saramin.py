import requests
from bs4 import BeautifulSoup
import json
import time
import random
import urllib.parse

def test_saramin_scrape(company_name):
    print(f"Scraping Saramin for {company_name}...")
    encoded_name = urllib.parse.quote(company_name)
    # Saramin search URL
    url = f"https://www.saramin.co.kr/zf_user/search/recruit?searchword={encoded_name}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.saramin.co.kr/"
    }
    
    jobs = []
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Saramin job items are usually under class 'item_recruit'
        job_items = soup.select('.item_recruit')
        
        for item in job_items[:3]: # Limit to top 3 for testing
            # Title & Link
            title_tag = item.select_one('.job_tit a')
            title = title_tag.text.strip() if title_tag else "제목 없음"
            link = "https://www.saramin.co.kr" + title_tag['href'] if title_tag and 'href' in title_tag.attrs else ""
            
            # Company Name
            corp_tag = item.select_one('.corp_name a')
            corp_name = corp_tag.text.strip() if corp_tag else "기업명 없음"
            
            # Job conditions (experience, education, location, etc.)
            conditions = item.select('.job_condition span')
            cond_texts = [c.text.strip() for c in conditions]
            
            # Deadline
            deadline_tag = item.select_one('.job_date .date')
            deadline = deadline_tag.text.strip() if deadline_tag else "마감일 미정"
            
            jobs.append({
                "company": corp_name,
                "title": title,
                "conditions": " / ".join(cond_texts),
                "deadline": deadline,
                "link": link
            })
            
    except Exception as e:
        print(f"Error scraping {company_name}: {e}")
        
    return jobs

if __name__ == "__main__":
    # Let's test with a few companies that always have active postings
    test_companies = ["삼성전자", "현대자동차", "카카오"]
    results = {}
    
    print("Starting Saramin scraper test...\n")
    
    for comp in test_companies:
        jobs = test_saramin_scrape(comp)
        results[comp] = jobs
        
        # Be polite, sleep for a random time between requests
        sleep_time = random.uniform(2.0, 4.0)
        print(f"Sleeping for {sleep_time:.1f} seconds to avoid blocking...")
        time.sleep(sleep_time)
        
    print("\n" + "="*50)
    print("SCRAPING RESULTS")
    print("="*50)
    print(json.dumps(results, ensure_ascii=False, indent=2))
