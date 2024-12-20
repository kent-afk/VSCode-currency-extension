const vscode = require('vscode');
const axios = require('axios');

let statusBar; // Объект для строки состояния

// Функция для получения курса валют
async function fetchCurrencyRate() {
    try {
        const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const rate = response.data.Valute.USD.Value; // Курс USD к RUB
        return rate.toFixed(2); // Возвращаем с двумя знаками после запятой
    } catch (error) {
        console.error('Error fetching currency rate:', error);
        return 'N/A'; // Возвращаем 'N/A' в случае ошибки
    }
}

// Функция для обновления текста в статусной строке
async function updateStatusBar() {
    const rate = await fetchCurrencyRate(); // Получаем курс валют
    statusBar.text = `$(graph-line) USD: ${rate} ₽`; // Компактный текст с иконкой
}

// Функция для отображения графика курса валют в WebView
function showGraph() {
    // Получаем курс валют
    fetchCurrencyRate().then(rate => {
        // Создаем WebView панель
        const panel = vscode.window.createWebviewPanel(
            'currencyGraph', // ID панели
            'Курс USD к RUB', // Заголовок
            vscode.ViewColumn.One, // Местоположение панели
            {
                enableScripts: true, // Разрешаем выполнение скриптов
            }
        );

        // HTML-контент для отображения графика (с использованием Chart.js)
        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>График курса валют</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    canvas {
                        display: block;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <h2>График курса USD к RUB</h2>
                <canvas id="currencyChart" width="400" height="200"></canvas>
                <script>
                    const ctx = document.getElementById('currencyChart').getContext('2d');
                    const chart = new Chart(ctx, {
                        type: 'line', // Тип графика
                        data: {
                            labels: ['Сегодня'], // Лейблы (например, можно обновить через время)
                            datasets: [{
                                label: 'Курс USD к RUB',
                                data: [${rate}], // Данные для графика (курс валюты)
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: false
                                }
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `;
    });
}

// Функция активации расширения
function activate(context) {
    // Создаем элемент строки состояния в правом углу
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'extension.showGraph'; // Подключение команды
    statusBar.tooltip = 'Показать график курса USD к RUB'; // Всплывающая подсказка
    statusBar.show(); // Отображаем статусный бар
    context.subscriptions.push(statusBar); // Добавляем в подписки

    // Регистрация команды для отображения графика
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.showGraph', showGraph)
    );

    // Обновляем курс при активации
    updateStatusBar();


    // Обновляем курс каждые 60 секунд
    setInterval(updateStatusBar, 60000);
}

// Функция деактивации расширения
function deactivate() {
    if (statusBar) {
        statusBar.dispose(); // Очищаем элемент строки состояния
    }
}

module.exports = {
    activate,
    deactivate
};
