from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify, session
import os
import pandas as pd
import joblib
from io import BytesIO
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'

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

            # Store results in session
            session['results_data'] = df.to_dict('records')
            session['results_columns'] = df.columns.tolist()
            session['results_summary'] = {
                'total': len(df),
                'low': int((predictions == 0).sum()),
                'medium': int((predictions == 1).sum()),
                'high': int((predictions == 2).sum())
            }

            # Store CSV data for download
            output = BytesIO()
            df.to_csv(output, index=False)
            output.seek(0)
            session['csv_data'] = output.getvalue()

            return redirect(url_for('results'))

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


@app.route('/results')
def results():
    if 'results_data' not in session:
        return redirect(url_for('index'))

    data = session.get('results_data', [])
    columns = session.get('results_columns', [])
    summary = session.get('results_summary', {})
    download_url = url_for('download_results')

    return render_template('results.html',
                         data=data,
                         columns=columns,
                         summary=summary,
                         download_url=download_url)


@app.route('/download')
def download_results():
    if 'csv_data' not in session:
        return redirect(url_for('index'))

    csv_data = session.get('csv_data')
    output = BytesIO(csv_data)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="stress_predictions.csv",
        mimetype="text/csv"
    )


if __name__ == '__main__':
    app.run(debug=True)
