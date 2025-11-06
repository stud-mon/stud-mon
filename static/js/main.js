document.addEventListener('DOMContentLoaded', function() {
    const manualForm = document.getElementById('manualForm');
    const manualResults = document.getElementById('manual-results');
    const predictionDisplay = document.getElementById('prediction-display');

    if (manualForm) {
        manualForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(manualForm);
            const submitButton = manualForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;

            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Обработка...</span>';

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    const prediction = data.prediction;

                    const stressLevels = {
                        0: { text: 'Низкий', color: '#10b981', description: 'Уровень стресса находится в пределах нормы.' },
                        1: { text: 'Средний', color: '#f59e0b', description: 'Умеренный уровень стресса. Рекомендуется обратить внимание на факторы, влияющие на стресс.' },
                        2: { text: 'Высокий', color: '#ef4444', description: 'Высокий уровень стресса. Рекомендуется обратиться за поддержкой и принять меры по снижению стресса.' }
                    };

                    const level = stressLevels[prediction] || stressLevels[0];

                    predictionDisplay.innerHTML = `
                        <div class="prediction-result">
                            <div class="prediction-level" style="color: ${level.color};">
                                <span class="prediction-value">${prediction}</span>
                                <span class="prediction-label">${level.text} уровень стресса</span>
                            </div>
                            <p class="prediction-description">${level.description}</p>
                        </div>
                    `;

                    manualResults.style.display = 'block';
                    manualResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    throw new Error('Ошибка при получении предсказания');
                }
            } catch (error) {
                predictionDisplay.innerHTML = `
                    <div class="prediction-error">
                        <p>Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.</p>
                    </div>
                `;
                manualResults.style.display = 'block';
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});

