from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
import os
import pandas as pd
import joblib
from io import BytesIO

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load your saved pipeline (scaler + model inside)
PIPELINE_PATH = "pickles/pipeline.pkl"
pipeline = joblib.load(PIPELINE_PATH)


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        form_type = request.form.get('form_type')

        # =====================================================
        # MANUAL SINGLE-STUDENT INPUT
        # =====================================================
        if form_type == 'manual':
            # Extract all form fields except form_type
            form_data = {k: float(v) for k, v in request.form.items() if k != "form_type"}

            # Convert to DataFrame
            df = pd.DataFrame([form_data])

            # Predict using pipeline
            prediction = pipeline.predict(df)[0]

            # ✅ Send JSON (your JS will render it)
            return jsonify({"prediction": int(prediction)})

    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
