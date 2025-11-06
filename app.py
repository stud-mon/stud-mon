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

EXPECTED_FEATURES = [
    'anxiety_level', 'self_esteem', 'mental_health_history', 'depression',
    'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem',
    'noise_level', 'living_conditions', 'safety', 'basic_needs',
    'academic_performance', 'study_load', 'teacher_student_relationship',
    'future_career_concerns', 'social_support', 'peer_pressure',
    'extracurricular_activities', 'bullying'
]


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        form_type = request.form.get('form_type')

        # =====================================================
        # MASS CSV UPLOAD PREDICTION
        # =====================================================
        if form_type == 'upload':
            if 'csv_file' not in request.files:
                return jsonify({'error': True, 'message': 'Файл не был загружен. Пожалуйста, выберите CSV файл.'}), 400

            file = request.files['csv_file']

            if file.filename == '':
                return jsonify({'error': True, 'message': 'Файл не был выбран. Пожалуйста, выберите CSV файл для загрузки.'}), 400

            if not file.filename.lower().endswith('.csv'):
                return jsonify({'error': True, 'message': 'Неверный тип файла. Пожалуйста, загрузите файл в формате CSV (.csv).'}), 400

            try:
                df = pd.read_csv(file)
            except Exception as e:
                return jsonify({'error': True, 'message': f'Ошибка при чтении CSV файла: {str(e)}. Пожалуйста, убедитесь, что файл имеет правильный формат CSV.'}), 400

            uploaded_features = set(df.columns.tolist())
            expected_features_set = set(EXPECTED_FEATURES)

            missing_features = expected_features_set - uploaded_features
            extra_features = uploaded_features - expected_features_set

            if missing_features or extra_features:
                error_parts = []
                if missing_features:
                    missing_list = ', '.join(sorted(missing_features))
                    error_parts.append(f'Отсутствующие столбцы: {missing_list}')
                if extra_features:
                    extra_list = ', '.join(sorted(extra_features))
                    error_parts.append(f'Лишние столбцы: {extra_list}')
                
                error_message = 'Несоответствие столбцов в файле. ' + ' | '.join(error_parts) + f'. Ожидаемые столбцы: {", ".join(sorted(EXPECTED_FEATURES))}'
                return jsonify({'error': True, 'message': error_message}), 400

            try:
                predictions = pipeline.predict(df)
            except ValueError as e:
                error_msg = str(e)
                if 'Feature names' in error_msg or 'feature names' in error_msg:
                    return jsonify({'error': True, 'message': f'Ошибка валидации данных: {error_msg}. Пожалуйста, убедитесь, что все столбцы соответствуют ожидаемым.'}), 400
                return jsonify({'error': True, 'message': f'Ошибка при выполнении предсказания: {error_msg}'}), 400
            except Exception as e:
                return jsonify({'error': True, 'message': f'Произошла ошибка при обработке данных: {str(e)}'}), 500

            df["stress_level_prediction"] = predictions

            session['results_data'] = df.to_dict('records')
            session['results_columns'] = df.columns.tolist()
            session['results_summary'] = {
                'total': len(df),
                'low': int((predictions == 0).sum()),
                'medium': int((predictions == 1).sum()),
                'high': int((predictions == 2).sum())
            }

            output = BytesIO()
            df.to_csv(output, index=False)
            output.seek(0)
            session['csv_data'] = output.getvalue()

            return jsonify({'success': True, 'redirect': url_for('results')})

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
