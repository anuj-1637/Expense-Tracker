 let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let categoryChart = null;
        let monthlyChart = null;

        const transactionForm = document.getElementById('transactionForm');
        const transactionList = document.getElementById('transactionList');
        const typeSelect = document.getElementById('type');
        const categorySelect = document.getElementById('category');
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpensesEl = document.getElementById('totalExpenses');
        const balanceEl = document.getElementById('balance');

        document.getElementById('date').valueAsDate = new Date();


        function filterCategories() {
            const type = typeSelect.value;
            const options = categorySelect.options;
            
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (option.value === "") continue;
                
                if (type === 'income') {
                    option.style.display = option.classList.contains('income-option') ? '' : 'none';
                } else {
                    option.style.display = option.classList.contains('expense-option') ? '' : 'none';
                }
            }
            
            if (categorySelect.options[categorySelect.selectedIndex].style.display === 'none') {
                for (let i = 0; i < options.length; i++) {
                    if (options[i].style.display !== 'none' && options[i].value !== "") {
                        categorySelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }

        function saveTransactions() {
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }

        function renderTransactions() {
            if (transactions.length === 0) {
                transactionList.innerHTML = `
                    <li class="text-center text-gray-500 py-8">
                        <i class="fas fa-receipt text-4xl mb-2"></i>
                        <p>No transactions yet</p>
                    </li>
                `;
                return;
            }

            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            transactionList.innerHTML = '';
            
            transactions.forEach(transaction => {
                const li = document.createElement('li');
                li.className = `transaction-item bg-gray-50 p-4 rounded-lg flex justify-between items-center ${
                    transaction.type === 'income' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`;
                
                li.innerHTML = `
                    <div class="flex-1">
                        <div class="font-semibold">${transaction.title}</div>
                        <div class="text-sm text-gray-600">
                            ${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                            ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                        </div>
                        <button class="delete-btn text-red-500 hover:text-red-700 mt-2" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                transactionList.appendChild(li);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    transactions = transactions.filter(t => t.id !== id);
                    saveTransactions();
                    renderTransactions();
                    updateSummary();
                    renderCharts();
                });
            });
        }

        function updateSummary() {
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const balance = totalIncome - totalExpenses;
            
            totalIncomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
            totalExpensesEl.textContent = `₹${totalExpenses.toFixed(2)}`;
            balanceEl.textContent = `₹${balance.toFixed(2)}`;
        }

        function renderCharts() {
            renderCategoryChart();
            renderMonthlyChart();
        }

        function renderCategoryChart() {
            const ctx = document.getElementById('categoryChart').getContext('2d');

            const expenses = transactions.filter(t => t.type === 'expense');
            const categories = {};
            
            expenses.forEach(expense => {
                if (categories[expense.category]) {
                    categories[expense.category] += expense.amount;
                } else {
                    categories[expense.category] = expense.amount;
                }
            });
            
            const categoryLabels = Object.keys(categories);
            const categoryData = Object.values(categories);
            
            const backgroundColors = [
                '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', 
                '#9966ff', '#ff9f40', '#8ac249', '#f67019'
            ];
            
            if (categoryChart) {
                categoryChart.destroy();
            }
            

            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryData,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function renderMonthlyChart() {
            const ctx = document.getElementById('monthlyChart').getContext('2d');
       
            const now = new Date();
            const currentYear = now.getFullYear();
            const monthlyData = {
                income: new Array(12).fill(0),
                expenses: new Array(12).fill(0)
            };

            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const year = date.getFullYear();
                const month = date.getMonth();
                
                if (year === currentYear) {
                    if (transaction.type === 'income') {
                        monthlyData.income[month] += transaction.amount;
                    } else {
                        monthlyData.expenses[month] += transaction.amount;
                    }
                }
            });
            

            const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            if (monthlyChart) {
                monthlyChart.destroy();
            }
            

            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthLabels,
                    datasets: [
                        {
                            label: 'Income',
                            data: monthlyData.income,
                            backgroundColor: '#4caf50',
                            borderWidth: 0
                        },
                        {
                            label: 'Expenses',
                            data: monthlyData.expenses,
                            backgroundColor: '#f44336',
                            borderWidth: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value;
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }


        typeSelect.addEventListener('change', filterCategories);
        
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('type').value;
            const title = document.getElementById('title').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;
            
            if (!title || !amount || !category || !date) {
                alert('Please fill all fields correctly.');
                return;
            }
            
            const newTransaction = {
                id: Date.now(),
                type,
                title,
                amount,
                category,
                date
            };
            
            transactions.push(newTransaction);
            saveTransactions();
            renderTransactions();
            updateSummary();
            renderCharts();
            
     
            this.reset();
            document.getElementById('date').valueAsDate = new Date();
            filterCategories();
        });

        filterCategories();
        renderTransactions();
        updateSummary();
        renderCharts();