import requests
from bs4 import BeautifulSoup
import json
import time
import random

def scrape_jobkorea(company_name):
    print(f"Scraping {company_name}...")
    url = f"https://www.jobkorea.co.kr/Search/?stext={company_name}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # JobKorea search result parsing
        jobs = []
        # Find the job listing elements (list-default is the common class for job lists)
        job_list = soup.select('.list-default .list-post')
        
        for job in job_list[:3]: # Get top 3 jobs
            title_elem = job.select_one('.post-list-info a.title')
            co_elem = job.select_one('.post-list-corp a.name')
            exp_elem = job.select_one('.post-list-info .option .exp')
            loc_elem = job.select_one('.post-list-info .option .loc')
            
            if title_elem:
                title = title_elem.text.strip()
                link = "https://www.jobkorea.co.kr" + title_elem['href']
                company = co_elem.text.strip() if co_elem else company_name
                exp = exp_elem.text.strip() if exp_elem else "경력무관"
                loc = loc_elem.text.strip() if loc_elem else "지역무관"
                
                jobs.append({
                    "title": title,
                    "company": company,
                    "link": link,
                    "experience": exp,
                    "location": loc
                })
                
        return jobs
    except Exception as e:
        print(f"Error scraping {company_name}: {e}")
        return []

if __name__ == "__main__":
    test_companies = ["삼성전자", "LG전자", "카카오"]
    results = {}
    
    for comp in test_companies:
        jobs = scrape_jobkorea(comp)
        results[comp] = jobs
        # Sleep to avoid getting blocked
        time.sleep(random.uniform(2.0, 4.0))
        
    print("\n--- Scraping Results ---")
    print(json.dumps(results, ensure_ascii=False, indent=2))
