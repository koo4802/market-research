import requests
from bs4 import BeautifulSoup
import json
import time
import random
import urllib.parse
import csv
import os
import sys

def scrape_saramin(company_name):
    encoded_name = urllib.parse.quote(company_name)
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
        job_items = soup.select('.item_recruit')
        
        for item in job_items[:3]: # Limit to top 3
            title_tag = item.select_one('.job_tit a')
            title = title_tag.text.strip() if title_tag else "제목 없음"
            link = "https://www.saramin.co.kr" + title_tag['href'] if title_tag and 'href' in title_tag.attrs else ""
            
            corp_tag = item.select_one('.corp_name a')
            corp_name = corp_tag.text.strip() if corp_tag else "기업명 없음"
            
            conditions = item.select('.job_condition span')
            cond_texts = [c.text.strip() for c in conditions]
            
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

def main():
    # If a limit argument is passed, only scrape that many for testing
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'public', 'data.csv')
    json_path = os.path.join(base_dir, 'public', 'jobs.json')
    
    companies = []
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('기업명', '').strip()
                if name:
                    companies.append(name)
    except FileNotFoundError:
        print(f"Cannot find {csv_path}")
        return

    if limit:
        companies = companies[:limit]

    results = {}
    total = len(companies)
    
    print(f"Starting scraper for {total} companies...")
    
    for i, comp in enumerate(companies):
        print(f"[{i+1}/{total}] Scraping: {comp}...")
        jobs = scrape_saramin(comp)
        results[comp] = jobs
        
        # Save incrementally in case it crashes
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
        if i < total - 1:
            time.sleep(random.uniform(2.0, 4.0))
            
    print("\nScraping finished successfully!")

if __name__ == "__main__":
    main()
