// js/calendar.js
// Calendar functionality

const Calendar = {
    schedule: [],
    electives: [],
    selectedElectives: [],
    notes: {},
    userTasks: {}, // Format: { 'MM/DD/YYYY': [{title: '', time: '', note: ''}] }
    userTasks: {}, // Format: { 'MM/DD/YYYY': [{title: '', time: '', note: ''}] }
    
    months: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ],
    
    weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    
    // Load schedule data from JSON
    async loadSchedule() {
        try {
            const response = await fetch('data/Schedule.json');
            this.schedule = await response.json();
            return true;
        } catch (error) {
            console.error('Error loading schedule:', error);
            return false;
        }
    },
    
    // Load electives list from JSON
    async loadElectives() {
        try {
            const response = await fetch('data/election activities.json');
            this.electives = await response.json();
            return true;
        } catch (error) {
            console.error('Error loading electives:', error);
            return false;
        }
    },
    
    // Parse date from DD/MM/YYYY format
    parseDate(dateStr) {
        const [month, day, year] = dateStr.split('/').map(n => parseInt(n));
        return new Date(year, month - 1, day);
    },
    
    // Get classes and tasks for a specific date
    getClassesForDate(date) {
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        
        return this.schedule.filter(item => {
            if (item['Дата'] !== dateStr) return false;
            
            // Check if it's an elective
            if (this.electives.includes(item['Дисциплина'])) {
                // Show only if selected
                return this.selectedElectives.includes(item['Дисциплина']);
            }
            
            // It's a mandatory course, always show
            return true;
        });
    },
    
    // Get user tasks for a specific date
    getUserTasksForDate(date) {
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        return this.userTasks[dateStr] || [];
    },
    
    // Determine day type (offline, online, in-person)
    getDayType(date) {
        const classes = this.getClassesForDate(date);
        const tasks = this.getUserTasksForDate(date);
        
        if (classes.length === 0 && tasks.length === 0) return 'offline';
        
        const hasInPerson = classes.some(c => c['Формат'] === 'очная' || c['Формат'] === '');
        const hasOnline = classes.some(c => c['Формат'] === 'онлайн');
        
        if (hasInPerson) return 'in-person';
        if (hasOnline) return 'online';
        if (tasks.length > 0) return 'has-tasks'; // New type for days with only user tasks
        return 'offline';
    },
    
    // Generate calendar for a month
    generateMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeekday = (firstDay.getDay() + 6) % 7; // Convert to Monday-based
        
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';
        
        // Month header
        const header = document.createElement('div');
        header.className = 'month-header';
        header.innerHTML = `<div class="month-name">${this.months[month]} ${year}</div>`;
        monthDiv.appendChild(header);
        
        // Calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        // Weekday headers
        this.weekdays.forEach(day => {
            const weekdayDiv = document.createElement('div');
            weekdayDiv.className = 'weekday-header';
            weekdayDiv.textContent = day;
            grid.appendChild(weekdayDiv);
        });
        
        // Empty cells before first day
        for (let i = 0; i < firstWeekday; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'day-cell empty';
            grid.appendChild(emptyDiv);
        }
        
        // Days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dayDiv = document.createElement('div');
            const dayType = this.getDayType(date);
            
            dayDiv.className = `day-cell ${dayType}`;
            dayDiv.textContent = day;
            dayDiv.dataset.date = `${year}-${month}-${day}`;
            
            // All days are clickable now
            dayDiv.onclick = () => this.showDaySchedule(date);
            
            grid.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(grid);
        return monthDiv;
    },
    
    // Show schedule for a specific day
    showDaySchedule(date) {
        const classes = this.getClassesForDate(date);
        const tasks = this.getUserTasksForDate(date);
        const modal = document.getElementById('dayModal');
        const header = document.getElementById('dayModalHeader');
        const body = document.getElementById('dayModalBody');
        
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        header.textContent = `${date.getDate()} ${this.months[date.getMonth()]} ${date.getFullYear()}`;
        body.innerHTML = '';
        
        // Add button to create new task
        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'btn btn-primary';
        addTaskBtn.style.marginBottom = '15px';
        addTaskBtn.style.width = '100%';
        addTaskBtn.textContent = '➕ Добавить дело';
        addTaskBtn.onclick = () => this.addUserTask(dateStr);
        body.appendChild(addTaskBtn);
        
        // Show classes
        classes.forEach(cls => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-item';
            
            const noteKey = `${cls['Дата']}_${cls['Дисциплина']}_${cls['Время']}`;
            const currentNote = this.notes[noteKey] || '';
            
            classDiv.innerHTML = `
                <div class="class-title">${cls['Дисциплина']}</div>
                <div class="class-info">
                    ${cls['Время']} | ${cls['Преподаватель']}<br>
                    ${cls['Формат'] === 'онлайн' ? 'Онлайн' : `Ауд. ${cls['Ауд.'] || 'не указана'}`}
                </div>
                <textarea 
                    class="note-input" 
                    placeholder="Добавить заметку (до 512 символов)"
                    maxlength="512"
                    data-note-key="${noteKey}"
                    rows="2"
                >${currentNote}</textarea>
            `;
            
            body.appendChild(classDiv);
        });
        
        // Show user tasks
        tasks.forEach((task, index) => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'class-item task-item';
            
            const taskKey = `task_${dateStr}_${index}`;
            
            taskDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="class-title" style="color: var(--button-bg);">📌 ${task.title}</div>
                    <button class="btn-delete" onclick="Calendar.deleteUserTask('${dateStr}', ${index})">🗑️</button>
                </div>
                <div class="class-info">
                    ${task.time || 'Время не указано'}
                </div>
                <textarea 
                    class="note-input" 
                    placeholder="Добавить заметку (до 512 символов)"
                    maxlength="512"
                    data-task-key="${taskKey}"
                    data-task-date="${dateStr}"
                    data-task-index="${index}"
                    rows="2"
                >${task.note || ''}</textarea>
            `;
            
            body.appendChild(taskDiv);
        });
        
        modal.classList.add('active');
    },
    
    // Add new user task
    addUserTask(dateStr) {
        const title = prompt('Название дела:');
        if (!title) return;
        
        const time = prompt('Время (необязательно):') || '';
        
        if (!this.userTasks[dateStr]) {
            this.userTasks[dateStr] = [];
        }
        
        this.userTasks[dateStr].push({
            title: title,
            time: time,
            note: ''
        });
        
        // Save and refresh
        Storage.saveUserTasks(this.userTasks);
        this.showDaySchedule(this.parseDate(dateStr));
        this.render();
    },
    
    // Delete user task
    deleteUserTask(dateStr, index) {
        if (confirm('Удалить это дело?')) {
            this.userTasks[dateStr].splice(index, 1);
            if (this.userTasks[dateStr].length === 0) {
                delete this.userTasks[dateStr];
            }
            Storage.saveUserTasks(this.userTasks);
            this.showDaySchedule(this.parseDate(dateStr));
            this.render();
        }
    },
    
    // Render the calendar
    render() {
        const container = document.getElementById('calendarContainer');
        container.innerHTML = '';
        
        // Get unique months from schedule
        const months = new Set();
        this.schedule.forEach(item => {
            const date = this.parseDate(item['Дата']);
            months.add(`${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`);
        });
        
        // Sort months chronologically
        const sortedMonths = Array.from(months).sort();
        
        // Generate calendar for each month
        sortedMonths.forEach(monthKey => {
            const [year, month] = monthKey.split('-').map(n => parseInt(n));
            const monthDiv = this.generateMonth(year, month);
            container.appendChild(monthDiv);
        });
    }
};
