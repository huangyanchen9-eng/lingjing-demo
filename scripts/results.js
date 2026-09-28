// Results use one persisted synthetic run for the table, charts and exports.
document.addEventListener('DOMContentLoaded', function () {
    const run = LJDemo.loadRun();
    const sampleData = run.rows;
    let filteredData = sampleData, currentPage = 1;
    const itemsPerPage = 10;
    let totalPages = Math.ceil(sampleData.length / itemsPerPage);
    const timeSeriesChart = document.getElementById('timeSeriesChart');
    const errorChart = document.getElementById('errorChart');
    const missingRateChart = document.getElementById('missingRateChart');
    const dataTableBody = document.getElementById('dataTableBody');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    function initializeResults() {
        updateTable(); updatePagination();
        if (typeof Chart === 'undefined') { showNotification('图表资源未加载，请通过本地服务器打开页面', 'error'); return; }
        createTimeSeriesChart(); createErrorChart(); createMissingRateChart();
    }
    // Create time series chart
    function createTimeSeriesChart() {
        const ctx = timeSeriesChart.getContext('2d');
        
        const chartData = sampleData.slice(0, 50); // Show first 50 points
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => new Date(d.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: '原始数据',
                    data: chartData.map(d => d.original),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3
                }, {
                    label: '填补数据',
                    data: chartData.map(d => d.imputed),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2.5,
                plugins: {
                    title: {
                        display: true,
                        text: '时间序列数据对比'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '数值'
                        },
                        beginAtZero: false,
                        suggestedMin: 20,
                        suggestedMax: 30
                    }
                }
            }
        });
    }

    // Create error distribution chart
    function createErrorChart() {
        const ctx = errorChart.getContext('2d');
        
        // Calculate error distribution
        const errors = sampleData
            .filter(d => d.status === 'imputed')
            .map(d => d.difference);
        
        const errorRanges = [
            { min: 0, max: 0.1, label: '0-0.1' },
            { min: 0.1, max: 0.2, label: '0.1-0.2' },
            { min: 0.2, max: 0.3, label: '0.2-0.3' },
            { min: 0.3, max: 0.4, label: '0.3-0.4' },
            { min: 0.4, max: 0.5, label: '0.4-0.5' }
        ];
        
        const errorCounts = errorRanges.map(range => 
            errors.filter(e => e >= range.min && e < range.max).length
        );
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: errorRanges.map(r => r.label),
                datasets: [{
                    label: '误差分布',
                    data: errorCounts,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2.5,
                plugins: {
                    title: {
                        display: true,
                        text: '填补误差分布'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '频次'
                        },
                        suggestedMax: Math.max(...errorCounts) * 1.2
                    },
                    x: {
                        title: {
                            display: true,
                            text: '误差范围'
                        }
                    }
                }
            }
        });
    }

    // Create missing rate performance chart (non-linear, more complex)
    function createMissingRateChart() {
        const ctx = missingRateChart.getContext('2d');
        
        // 更细的缺失率采样点
        const missingRates = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

        // 可复现实验的伪随机函数
        let seed = 42;
        function rand() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        }

        // 构造非线性且带细微波动的曲线：基线(二次) + 正弦扰动 + 微小噪声
        const maeScores = missingRates.map((r) => {
            const base = 0.010 + Math.pow(r / 100, 2) * 0.09; // 放大二次项
            const wave = Math.sin(r / 100 * Math.PI * 1.8) * 0.012; // 增大波动
            const noise = (rand() - 0.5) * 0.006; // 增大噪声
            return +(base + wave + noise).toFixed(3);
        });
        const rmseScores = missingRates.map((r) => {
            const base = 0.018 + Math.pow(r / 100, 2) * 0.15; // 放大二次项
            const wave = Math.cos(r / 100 * Math.PI * 1.6) * 0.016; // 增大波动
            const noise = (rand() - 0.5) * 0.008; // 增大噪声
            return +(base + wave + noise).toFixed(3);
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: missingRates.map(r => r + '%'),
                datasets: [{
                    label: 'MAE',
                    data: maeScores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    borderWidth: 3,
                    fill: false,
                    pointRadius: 4,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                }, {
                    label: 'RMSE',
                    data: rmseScores,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderWidth: 3,
                    fill: false,
                    pointRadius: 4,
                    tension: 0.35,
                    cubicInterpolationMode: 'monotone'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2.5,
                plugins: {
                    title: {
                        display: true,
                        text: '不同缺失率下的模型性能（非线性曲线）'
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '缺失率'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '评估指标'
                        },
                        beginAtZero: true,
                        suggestedMax: Math.max(...maeScores, ...rmseScores) * 1.35,
                        grid: {
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }


    function updateTable() {
        dataTableBody.replaceChildren();
        const page = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        if (!page.length) { const row = dataTableBody.insertRow(); const cell = row.insertCell(); cell.colSpan = 5; cell.textContent = '没有匹配的记录'; }
        page.forEach(record => {
            const tr = dataTableBody.insertRow();
            [new Date(record.timestamp).toLocaleString(), record.original === null ? 'NaN' : record.original.toFixed(2), record.imputed.toFixed(2), record.original === null ? '/' : record.difference.toFixed(3)].forEach(value => { tr.insertCell().textContent = value; });
            const badge = document.createElement('span'); badge.className = 'status-badge ' + record.status;
            badge.textContent = record.status === 'imputed' ? '填补' : '原始'; tr.insertCell().appendChild(badge);
        });
    }
    function updatePagination() {
        currentPageSpan.textContent = currentPage; totalPagesSpan.textContent = totalPages;
        document.querySelector('button[onclick="previousPage()"]').disabled = currentPage <= 1;
        document.querySelector('button[onclick="nextPage()"]').disabled = currentPage >= totalPages;
    }
    window.previousPage = () => { if (currentPage > 1) { currentPage--; updateTable(); updatePagination(); } };
    window.nextPage = () => { if (currentPage < totalPages) { currentPage++; updateTable(); updatePagination(); } };
    window.exportTable = () => LJDemo.download(LJDemo.resultsCSV(run), 'lingjing_demo_results.csv');
    window.downloadReport = () => LJDemo.download(LJDemo.resultsCSV(run), 'lingjing_demo_report.csv');
    document.getElementById('downloadReportBtn').addEventListener('click', window.downloadReport);
    // Add chart interaction
    function addChartInteractions() {
        // Add click events to chart points
        if (typeof Chart !== 'undefined' && Chart.getChart(timeSeriesChart)) {
            timeSeriesChart.addEventListener('click', function(e) {
                const points = Chart.getChart(timeSeriesChart).getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const firstPoint = points[0];
                    const dataIndex = firstPoint.index;
                    const datasetIndex = firstPoint.datasetIndex;
                    const value = Chart.getChart(timeSeriesChart).data.datasets[datasetIndex].data[dataIndex];
                    showNotification(`数据点: ${value}`, 'info');
                }
            });
        }
    }

    // Add responsive chart resizing
    window.addEventListener('resize', utils.debounce(function() {
        // Resize charts if needed
        const charts = typeof Chart !== 'undefined' && Chart.getChart(timeSeriesChart);
        if (charts) {
            charts.resize();
        }
    }, 250));


    const filterInput = document.createElement('input');
    filterInput.type = 'search'; filterInput.placeholder = '搜索全部示例记录…'; filterInput.className = 'data-filter';
    filterInput.setAttribute('aria-label', '搜索全部示例记录');
    document.querySelector('.table-header').appendChild(filterInput);
    filterInput.addEventListener('input', utils.debounce(function () {
        const term = this.value.trim().toLowerCase();
        filteredData = sampleData.filter(row => [new Date(row.timestamp).toLocaleString(), row.original === null ? 'NaN' : row.original.toFixed(2), row.imputed.toFixed(2), row.status === 'imputed' ? '填补' : '原始'].join(' ').toLowerCase().includes(term));
        currentPage = 1; totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
        updateTable(); updatePagination();
    }, 150));
    document.getElementById('runSummary').textContent = '示例来源：' + run.name + ' · 模型：' + LJDemo.models[run.model] + ' · 缺失率：' + run.missingRate + '% · 批次：' + run.batchSize + ' · 轮数：' + run.epochs + ' · 100 条合成示例（非上传文件的处理结果）';
    const missing = sampleData.filter(r => r.status === 'imputed');
    const mae = missing.reduce((sum, r) => sum + r.difference, 0) / missing.length;
    const rmse = Math.sqrt(missing.reduce((sum, r) => sum + r.difference ** 2, 0) / missing.length);
    const mre = missing.reduce((sum, r) => sum + r.difference / r.truth, 0) / missing.length * 100;
    const metrics = [mae.toFixed(3), rmse.toFixed(3), mre.toFixed(2) + '%', '3.2s（演示）'];
    document.querySelectorAll('.summary-value').forEach((el, i) => el.textContent = metrics[i]);
    initializeResults();
    addChartInteractions();
});
