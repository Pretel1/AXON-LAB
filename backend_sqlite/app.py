from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import os

app = Flask(__name__)
CORS(app)
DB_PATH = 'axon.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS perfiles (id TEXT PRIMARY KEY, nombre TEXT, email TEXT, rol TEXT)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS laboratorios (
            id TEXT PRIMARY KEY, titulo TEXT, descripcion TEXT, categoria TEXT, tipo TEXT, url TEXT, user_id TEXT
        )''')
init_db()

@app.route('/api/laboratorios', methods=['POST'])
def crear_lab():
    data = request.json
    lab_id = str(uuid.uuid4())
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('INSERT INTO laboratorios VALUES (?,?,?,?,?,?,?)',
            (lab_id, data['titulo'], data['descripcion'], data['categoria'], data['tipo'], data['url'], data['user_id']))
    return jsonify({"success": True, "id": lab_id})

@app.route('/api/laboratorios', methods=['GET'])
def listar_labs():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        labs = [dict(row) for row in conn.execute('SELECT * FROM laboratorios').fetchall()]
    return jsonify({"success": True, "labs": labs})

if __name__ == '__main__':
    app.run(debug=True, port=5000)