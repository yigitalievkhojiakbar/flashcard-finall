from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
import requests

app = Flask(__name__)

# ========== SOZLAMALAR ==========
BOT_TOKEN = "8908338925:AAGRxfWNRNStIYAbCNiZL4Q0eWIrePY84zE"
WEBAPP_URL = "https://flashcard-finall.onrender.com"

# ========== TELEGRAM XABAR YUBORISH ==========
def send_telegram_message(chat_id, text, reply_markup=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        data["reply_markup"] = reply_markup
    try:
        requests.post(url, json=data, timeout=5)
    except Exception as e:
        print(f"Xato: {e}")

# ========== WEBHOOK ==========
@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        update = request.get_json()
        if update and 'message' in update:
            msg = update['message']
            chat_id = msg['chat']['id']
            text = msg.get('text', '')
            
            if text == '/start':
                reply_markup = {
                    "inline_keyboard": [
                        [{"text": "📚 Open", "web_app": {"url": WEBAPP_URL}}]
                    ]
                }
                send_telegram_message(
                    chat_id,
                    "👋 Salom!\n\n📚 Flashcardlar ishlashga tayyor!\n\nQuyidagi tugmani bosing va so'z yodlashni boshlang:",
                    reply_markup
                )
        return "ok", 200
    except Exception as e:
        print(f"Webhook xato: {e}")
        return "ok", 200

# ========== ASOSIY SAHIFA ==========
@app.route('/')
def index():
    return render_template('index.html')

# ========== API ENDPOINTS ==========
@app.route('/api/save', methods=['POST'])
def save_data():
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        cards = data.get('cards', [])
        os.makedirs('data', exist_ok=True)
        with open(f'data/{user_id}_cards.json', 'w', encoding='utf-8') as f:
            json.dump({'cards': cards, 'saved_at': datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/load', methods=['GET'])
def load_data():
    user_id = request.args.get('user_id', 'default')
    filename = f'data/{user_id}_cards.json'
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify({'cards': data['cards']})
    else:
        empty_cards = [{'id': i, 'front': '', 'back': ''} for i in range(50)]
        return jsonify({'cards': empty_cards})

@app.route('/api/save-results', methods=['POST'])
def save_results():
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        results = data.get('results', {})
        os.makedirs('results', exist_ok=True)
        with open(f'results/{user_id}_results.json', 'w', encoding='utf-8') as f:
            json.dump({'results': results, 'saved_at': datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
