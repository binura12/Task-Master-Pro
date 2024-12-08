const { app, BrowserWindow } = require('electron');
const path = require('path')

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let completed = JSON.parse(localStorage.getItem('completed')) || [];
let currentView = 'active';

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-message';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2500);
}

function updateLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('completed', JSON.stringify(completed));
}

function switchView(view) {
    currentView = view;
    const activeView = document.getElementById('activeView');
    const historyView = document.getElementById('historyView');
    const todoForm = document.getElementById('todoForm');
    const activeButton = document.getElementById('activeButton');
    const historyButton = document.getElementById('historyButton');

    if (view === 'active') {
        activeView.classList.remove('hidden');
        historyView.classList.add('hidden');
        todoForm.classList.remove('hidden');
        activeButton.classList.add('active');
        historyButton.classList.remove('active');
    } else {
        activeView.classList.add('hidden');
        historyView.classList.remove('hidden');
        todoForm.classList.add('hidden');
        historyButton.classList.add('active');
        activeButton.classList.remove('active');
    }
    renderLists();
}

function searchCompletedTasks() {
    const searchTerm = document.getElementById('searchCompleted').value.toLowerCase();
    const filteredCompleted = completed.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description.toLowerCase().includes(searchTerm)
    );
    renderCompletedList(filteredCompleted);
}

function addTodo(event) {
    event.preventDefault();

    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    const dueDate = document.getElementById('todoDueDate').value;
    const priority = document.getElementById('todoPriority').value;
    const type = document.getElementById('todoType').value;

    todos.push({
        title,
        description,
        dueDate,
        priority,
        type,
        createdDate: new Date().toISOString(),
    });

    updateLocalStorage();
    renderLists();
    event.target.reset();
    showNotification('Task added successfully!');
}

function completeTodo(index) {
    const todo = todos[index];
    todos.splice(index, 1);
    completed.push({
        ...todo,
        completedDate: new Date().toISOString()
    });
    updateLocalStorage();
    renderLists();
    showNotification('Task completed!');
}

function deleteTodo(index, isCompleted = false) {
    if (isCompleted) {
        completed.splice(index, 1);
    } else {
        todos.splice(index, 1);
    }
    updateLocalStorage();
    renderLists();
    showNotification('Task deleted!');
}

function getPriorityColor(priority) {
    const colors = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.low;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function applyFilters() {
    renderLists();
}

function filterTodos(todoList) {
    const priorityFilter = document.getElementById('priorityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    return todoList.filter(todo => {
        const priorityMatch = priorityFilter === 'all' || todo.priority === priorityFilter;
        const typeMatch = typeFilter === 'all' || todo.type === typeFilter;
        return priorityMatch && typeMatch;
    });
}

function renderCompletedList(completedTodos) {
    const completedList = document.getElementById('completedList');

    if (completedTodos.length === 0) {
        completedList.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        No completed tasks found
                    </div>
                `;
        return;
    }

    completedList.innerHTML = completedTodos.map((todo, index) => `
                <div class="glass-effect p-4 rounded-lg card-hover">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="font-semibold text-lg line-through">${todo.title}</h3>
                            <p class="text-gray-600 text-sm line-through">${todo.description}</p>
                        </div>
                        <button onclick="deleteTodo(${index}, true)" 
                            class="text-red-500 hover:text-red-700 p-1 transition-colors">
                            ×
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-2 text-sm">
                        <span class="${getPriorityColor(todo.priority)} px-3 py-1 rounded-full">
                            ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                        </span>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            ${todo.type.charAt(0).toUpperCase() + todo.type.slice(1)}
                        </span>
                        <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                            Completed: ${formatDate(todo.completedDate)}
                        </span>
                    </div>
                </div>
            `).join('');
}

function renderLists() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = filterTodos(todos);

    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        No active tasks found
                    </div>
                `;
        return;
    }

    todoList.innerHTML = filteredTodos.map((todo, index) => `
                <div class="glass-effect p-4 rounded-lg card-hover">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="font-semibold text-lg">${todo.title}</h3>
                            <p class="text-gray-600 text-sm">${todo.description}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="completeTodo(${index})" 
                                class="text-green-500 hover:text-green-700 p-1 transition-colors">
                                ✓
                            </button>
                            <button onclick="deleteTodo(${index})" 
                                class="text-red-500 hover:text-red-700 p-1 transition-colors">
                                ×
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 text-sm">
                        <span class="${getPriorityColor(todo.priority)} px-3 py-1 rounded-full">
                            ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                        </span>
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            ${todo.type.charAt(0).toUpperCase() + todo.type.slice(1)}
                        </span>
                        <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                            Due: ${formatDate(todo.dueDate)}
                        </span>
                    </div>
                </div>
            `).join('');

    renderCompletedList(completed);
}

// Initial setup
switchView('active');