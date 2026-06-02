from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
import logging

# Logging sozlamalari
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Bot sozlamalari - Environment Variables dan o'qiladi
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        return "Webhook is active", 200
    
    try:
        # Webhook POST so'rovlarini qabul qilish
        logger.info("Webhook called")
        return "ok", 200
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return "error", 500

@app.route('/api/save', methods=['POST'])
def save_data():
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        cards = data.get('cards', [])
        os.makedirs('data', exist_ok=True)
        filename = f'data/{user_id}_cards.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({'cards': cards, 'saved_at': datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Save error: {e}")
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
        filename = f'results/{user_id}_results.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({'results': results, 'saved_at': datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Save results error: {e}")
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
