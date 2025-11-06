from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
import os
import pandas as pd
import joblib
from io import BytesIO

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

PIPELINE_PATH = "pickles/pipeline.pkl"
pipeline = joblib.load(PIPELINE_PATH)


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        form_type = request.form.get('form_type')

        # =====================================================
        # MASS CSV UPLOAD PREDICTION
        # =====================================================
        if form_type == 'upload':
            if 'csv_file' not in request.files:
                return redirect(url_for('index'))

            file = request.files['csv_file']

            if file.filename == '':
                return redirect(url_for('index'))

            df = pd.read_csv(file)

            # Pipeline handling preprocessing + prediction
            predictions = pipeline.predict(df)
            df["stress_level_prediction"] = predictions

            # Generating downloadable CSV
            output = BytesIO()
            df.to_csv(output, index=False)
            output.seek(0)

            return send_file(
                output,
                as_attachment=True,
                download_name="stress_predictions.csv",
                mimetype="text/csv"
            )

        # =====================================================
        # MANUAL SINGLE-STUDENT INPUT
        # =====================================================
        elif form_type == 'manual':
            form_data = {k: float(v) for k, v in request.form.items() if k != "form_type"}

            df = pd.DataFrame([form_data])

            # Predicting using pipeline
            prediction = pipeline.predict(df)[0]

            return jsonify({"prediction": int(prediction)})

    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
