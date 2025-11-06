from flask import Flask, render_template, request, redirect, url_for, send_file
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        form_type = request.form.get('form_type')
        
        if form_type == 'upload':
            if 'csv_file' in request.files:
                file = request.files['csv_file']
                if file.filename != '':
                    pass
            return redirect(url_for('index'))
        
        elif form_type == 'manual':
            data = {
                'anxiety_level': request.form.get('anxiety_level'),
                'self_esteem': request.form.get('self_esteem'),
            }
            return redirect(url_for('index'))
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
