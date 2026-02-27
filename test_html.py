import requests
import json
import time

def test_fetch():
    url = f"https://www.jobkorea.co.kr/Search/?stext=삼성전자"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    response = requests.get(url, headers=headers)
    with open("C:\\Users\\koo48\\market\\job-dashboard\\test_html.html", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Saved HTML")

if __name__ == "__main__":
    test_fetch()
