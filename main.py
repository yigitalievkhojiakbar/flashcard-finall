# main.py
from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Dispatcher, CommandHandler, CallbackContext

app = Flask(__name__)

# Bot sozlamalari - Render Environment Variables dan o'qiladi
BOT_TOKEN = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://your-app.onrender.com")

from telegram import Bot
bot = Bot(token=BOT_TOKEN)
dispatcher = Dispatcher(bot, None, use_context=True)

# ---------- Telegram bot handlerlari ----------
async def start(update: Update, context: CallbackContext):
    user = update.effective_user
    keyboard = [[InlineKeyboardButton("📚 Open", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"👋 Salom {user.first_name}!\n\n📚 Flashcard yodlash uchun Open tugmasini bosing.",
        reply_markup=reply_markup
    )

dispatcher.add_handler(CommandHandler("start", start))

# ---------- Flask endpointlari ----------
@app.route('/')
def index():
    return render_template('index.html')

@app.route(f'/webhook', methods=['POST'])
def webhook():
    if request.method == "POST":
        update = Update.de_json(request.get_json(force=True), bot)
        dispatcher.process_update(update)
        return "ok", 200
    return "method not allowed", 405

# Sizning eski API laringiz (save, load, save-results) shu yerda qoladi
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
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
