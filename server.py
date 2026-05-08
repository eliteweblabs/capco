from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/railway', methods=['POST'])
def railway():
    cmd = request.json.get('command', '')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return jsonify({'stdout': result.stdout, 'stderr': result.stderr})

app.run(port=3000)
