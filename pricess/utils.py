import requests
from bs4 import BeautifulSoup
import tgju_crawl as tgju

def get_price_from_tgju(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        price_element = soup.find('span', {'data-col': 'info.last_trade.PDrCotVal'})
        
        if price_element:
            return price_element.text.strip()
            
    except Exception as e:
        print(f"Error: {e}")
        return None
    return None


CHART_SYMBOL_MAP = {
    'دلار آمریکا': 'دلار',
    'یورو': 'یورو',
    'پوند': 'پوند',
    'دلار کانادا': 'دلار کانادا',
    'لیر ترکیه': 'لیر ترکیه',
    'درهم امارات': 'درهم امارات',
    'یوان چین': 'یوان چین',
    'انس طلا': 'انس طلا',
    'طلای ۱۸ عیار': 'طلای 18 عیار',
    'طلای ۲۴ عیار': 'طلای 24 عیار',
    'سکه امامی': 'سکه امامی',
    'سکه بهار آزادی': 'سکه بهار آزادی',
    'بیت کوین': 'بیت کوین',
    'اتریوم': 'اتریوم',
    'تتر': 'تتر',
    'ترون': 'ترون',
    'ریپل': 'ریپل',
    'نفت اپک': 'نفت اپک',
    'نفت برنت': 'نفت برنت',
    'نفت خام': 'نفت خام',
    'نفت سبک عربستان': 'نفت سبک عربستان',
}


def get_chart_data(symbol_name):
    lib_symbol = CHART_SYMBOL_MAP.get(symbol_name, symbol_name)
    
    try:
        print(f"📊 در حال دریافت داده برای: {symbol_name} -> {lib_symbol}")
        df = tgju.get_tgju_data(symbol=lib_symbol)
        
        if df is not None and not df.empty:
            prices = df['Close'].astype(str).str.replace(',', '').astype(float).tolist()
            dates = df.index.tolist()
            
            print(f"✅ دریافت شد: {len(prices)} نقطه داده")
            return {
                'prices': prices,
                'dates': dates,
                'symbol': lib_symbol
            }
        else:
            print(f"⚠️ دیتایی برای {symbol_name} پیدا نشد")
            return None
        
    except Exception as e:
        print(f"❌ خطا برای {symbol_name}: {e}")
        return None