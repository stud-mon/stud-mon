document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csv_file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileText = document.getElementById('file-text');
    const fileIcon = document.getElementById('file-icon');
    const fileLabel = document.getElementById('file-label');
    const fileClearBtn = document.getElementById('file-clear-btn');

    function clearFile() {
        csvFileInput.value = '';
        fileText.style.display = 'block';
        fileIcon.style.display = 'block';
        fileNameDisplay.style.display = 'none';
        fileClearBtn.style.display = 'none';
        fileLabel.classList.remove('file-selected');
    }

    function showFile(file) {
        fileNameDisplay.textContent = file.name;
        fileText.style.display = 'none';
        fileIcon.style.display = 'none';
        fileNameDisplay.style.display = 'block';
        fileClearBtn.style.display = 'block';
        fileLabel.classList.add('file-selected');
    }

    if (csvFileInput && fileNameDisplay) {
        csvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                showFile(file);
            } else {
                clearFile();
            }
        });

        if (fileClearBtn) {
            fileClearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                clearFile();
            });
        }
    }

    const uploadForm = document.getElementById('uploadForm');
    const uploadError = document.getElementById('upload-error');
    const uploadErrorText = document.getElementById('upload-error-text');
    const uploadSubmitBtn = document.getElementById('upload-submit-btn');

    function hideUploadError() {
        if (uploadError) {
            uploadError.style.display = 'none';
        }
    }

    function showUploadError(message) {
        if (uploadError && uploadErrorText) {
            uploadErrorText.textContent = message;
            uploadError.style.display = 'flex';
            uploadError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            console.error('Error elements not found:', { uploadError, uploadErrorText });
        }
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            hideUploadError();
            
            const fileInput = document.getElementById('csv_file');
            
            if (!fileInput) {
                showUploadError('Ошибка: поле загрузки файла не найдено.');
                return;
            }
            
            if (!fileInput.files || fileInput.files.length === 0) {
                showUploadError('Файл не был выбран. Пожалуйста, выберите CSV файл для загрузки.');
                fileInput.focus();
                return;
            }
            
            const file = fileInput.files[0];
            
            if (!file) {
                showUploadError('Файл не был выбран. Пожалуйста, выберите CSV файл для загрузки.');
                fileInput.focus();
                return;
            }
            
            if (!file.name || !file.name.toLowerCase().endsWith('.csv')) {
                showUploadError('Неверный тип файла. Пожалуйста, загрузите файл в формате CSV (.csv).');
                return;
            }

            const formData = new FormData(uploadForm);
            const originalButtonText = uploadSubmitBtn.innerHTML;
            uploadSubmitBtn.disabled = true;
            uploadSubmitBtn.innerHTML = '<span>Обработка...</span>';

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    showUploadError('Сервер вернул неожиданный ответ. Пожалуйста, попробуйте еще раз.');
                    return;
                }

                if (!response.ok || data.error) {
                    showUploadError(data.message || 'Произошла ошибка при загрузке файла.');
                } else if (data.success && data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    showUploadError('Неожиданный ответ от сервера.');
                }
            } catch (error) {
                showUploadError('Произошла ошибка при отправке файла. Пожалуйста, попробуйте еще раз.');
            } finally {
                uploadSubmitBtn.disabled = false;
                uploadSubmitBtn.innerHTML = originalButtonText;
            }
        });
    }

    if (csvFileInput) {
        csvFileInput.addEventListener('change', function() {
            hideUploadError();
        });
    }

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

    const sortHeader = document.querySelector('.sortable');
    const tbody = document.getElementById('results-tbody');
    const paginationWrapper = document.getElementById('pagination-wrapper');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationPages = document.getElementById('pagination-pages');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentPage = 1;
    const recordsPerPage = 15;
    let allRows = [];
    let sortDirection = null;
    
    function initializePagination() {
        if (!tbody) return;
        
        allRows = Array.from(tbody.querySelectorAll('tr'));
        const totalRecords = allRows.length;
        
        if (totalRecords > recordsPerPage) {
            if (paginationWrapper) paginationWrapper.style.display = 'block';
            showPage(1);
        } else {
            if (paginationWrapper) paginationWrapper.style.display = 'none';
        }
    }
    
    function showPage(page) {
        if (!tbody) return;
        
        const totalRecords = allRows.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);
        currentPage = Math.max(1, Math.min(page, totalPages));
        
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        
        allRows.forEach((row, index) => {
            if (index >= startIndex && index < endIndex) {
                row.style.display = '';
                const displayIndex = index + 1;
                row.querySelector('td:first-child').textContent = displayIndex;
            } else {
                row.style.display = 'none';
            }
        });
        
        if (paginationInfo) {
            const start = startIndex + 1;
            const end = Math.min(endIndex, totalRecords);
            paginationInfo.textContent = `Показано ${start}-${end} из ${totalRecords} записей`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }
        
        if (paginationPages) {
            paginationPages.innerHTML = '';
            const maxPages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
            let endPage = Math.min(totalPages, startPage + maxPages - 1);
            
            if (endPage - startPage < maxPages - 1) {
                startPage = Math.max(1, endPage - maxPages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.type = 'button';
                pageBtn.className = 'pagination-page-btn';
                if (i === currentPage) {
                    pageBtn.classList.add('active');
                }
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => showPage(i));
                paginationPages.appendChild(pageBtn);
            }
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => showPage(currentPage - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => showPage(currentPage + 1));
    }
    
    if (sortHeader && tbody) {
        sortHeader.addEventListener('click', function() {
            const sortIcon = sortHeader.querySelector('.sort-icon');
            
            if (sortDirection === null || sortDirection === 'desc') {
                sortDirection = 'asc';
                sortIcon.textContent = '↑';
            } else {
                sortDirection = 'desc';
                sortIcon.textContent = '↓';
            }
            
            allRows.sort((a, b) => {
                const aLevel = parseInt(a.getAttribute('data-stress-level'));
                const bLevel = parseInt(b.getAttribute('data-stress-level'));
                
                if (sortDirection === 'asc') {
                    return aLevel - bLevel;
                } else {
                    return bLevel - aLevel;
                }
            });
            
            showPage(1);
        });
    }
    
    initializePagination();
});

