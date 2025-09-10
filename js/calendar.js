// js/calendar.js
// Calendar functionality
//lol

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
    
    // Determine day type and activities (offline, online, in-person, tasks)
    getDayType(date) {
        const classes = this.getClassesForDate(date);
        const tasks = this.getUserTasksForDate(date);
        
        if (classes.length === 0 && tasks.length === 0) return { primary: 'offline', activities: [] };
        
        const hasInPerson = classes.some(c => c['Формат'] === 'очная' || c['Формат'] === '');
        const hasOnline = classes.some(c => c['Формат'] === 'онлайн');
        const hasTasks = tasks.length > 0;
        
        const activities = [];
        if (hasInPerson) activities.push('in-person');
        if (hasOnline) activities.push('online');
        if (hasTasks) activities.push('has-tasks');
        
        // Determine primary color by priority: in-person > online > tasks
        let primary = 'offline';
        if (hasInPerson) primary = 'in-person';
        else if (hasOnline) primary = 'online';
        else if (hasTasks) primary = 'has-tasks';
        
        return { primary, activities };
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
            const dayTypeData = this.getDayType(date);
            
            let className = `day-cell ${dayTypeData.primary}`;
            
            // Add classes for past days and current day
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for comparison
            const currentDate = new Date(date);
            currentDate.setHours(0, 0, 0, 0);
            
            if (currentDate < today) {
                className += ' past-day';
            } else if (currentDate.getTime() === today.getTime()) {
                className += ' current-day';
            }
            
            dayDiv.className = className;
            dayDiv.dataset.date = `${year}-${month}-${day}`;
            
            // Create day content with number and icons
            const dayContent = document.createElement('div');
            dayContent.className = 'day-content';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayContent.appendChild(dayNumber);
            
            // Add activity icons if there are any activities
            if (dayTypeData.activities.length > 0) {
                const iconsDiv = document.createElement('div');
                iconsDiv.className = 'day-icons';
                
                dayTypeData.activities.forEach(activity => {
                    const icon = document.createElement('span');
                    icon.className = `activity-icon ${activity}`;
                    
                    switch (activity) {
                        case 'in-person':
                            icon.textContent = '🏛️';
                            break;
                        case 'online':
                            icon.textContent = '💻';
                            break;
                        case 'has-tasks':
                            icon.textContent = '📌';
                            break;
                    }
                    
                    iconsDiv.appendChild(icon);
                });
                
                dayContent.appendChild(iconsDiv);
            }
            
            dayDiv.appendChild(dayContent);
            
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
                    ${cls['Формат'] === 'онлайн' ? 'Онлайн' : `Ауд. ${cls['Аудитория'] ? (cls['Аудитория'].includes('гибрид') ? cls['Аудитория'].replace(' гибрид', '') : cls['Аудитория']) : 'не указана'}`}
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
        
        let timeInput;
        let attempts = 0;
        const maxAttempts = 3;
        let time = '';
        
        while (attempts < maxAttempts) {
            timeInput = prompt(`Введите время (оставьте пустым, если не нужно):\n\nПримеры: 14:30, 18:00-19:30, 2 дня, пол третьего, четверть седьмого, с 9 до 11, около 15:00`);
            
            if (timeInput === null) return; // User cancelled
            
            // Handle empty input as no time
            if (!timeInput || timeInput.trim() === '') {
                time = '';
                break;
            }
            
            const parsedTime = this.parseTimeInput(timeInput);
            
            if (parsedTime.valid) {
                time = parsedTime.formatted;
                break;
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    alert(`Не удалось понять время "${timeInput}". Попробуйте ещё раз.\n\nПримеры:\n• 14:30, 18.00\n• 18:00-19:30, с 9 до 11\n• 2 дня, 8 вечера\n• пол третьего, четверть седьмого\n• около 15:00, примерно в 9`);
                } else {
                    alert('Превышено количество попыток. Дело будет добавлено без времени.');
                    time = '';
                }
            }
        }
        
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
    
    // Parse time input in various formats
    parseTimeInput(input) {
        if (!input || input.trim() === '') {
            return { valid: false };
        }
        
        const text = input.toLowerCase().trim();
        
        // Remove common prefixes/suffixes
        const cleanText = text
            .replace(/^(около|примерно|приблизительно|где-то|в)\s+/, '')
            .replace(/\s+(часов|ч\.|ч)$/, '');
        
        // Time ranges: 18:00-19:30, с 9 до 11, 14.30-15.45
        const rangeFormats = [
            /^(\d{1,2}[:.]?\d{0,2})\s*[-–—]\s*(\d{1,2}[:.]?\d{0,2})$/,
            /^с\s+(\d{1,2}(?:[:.]?\d{0,2})?)\s+до\s+(\d{1,2}(?:[:.]?\d{0,2})?)$/,
            /^от\s+(\d{1,2}(?:[:.]?\d{0,2})?)\s+до\s+(\d{1,2}(?:[:.]?\d{0,2})?)$/
        ];
        
        for (const rangePattern of rangeFormats) {
            const rangeMatch = cleanText.match(rangePattern);
            if (rangeMatch) {
                const start = this.parseTimeSegment(rangeMatch[1]);
                const end = this.parseTimeSegment(rangeMatch[2]);
                if (start && end) {
                    return { valid: true, formatted: `${start}–${end}` };
                }
            }
        }
        
        // Single time formats
        const singleTime = this.parseSingleTime(cleanText);
        if (singleTime) {
            return { valid: true, formatted: singleTime };
        }
        
        return { valid: false };
    },
    
    // Parse single time segment
    parseTimeSegment(timeStr) {
        const text = timeStr.trim();
        
        // Standard formats: HH:MM, HH.MM, H:MM, H.MM, HH, H
        const standardTime = text.match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
        if (standardTime) {
            const hours = parseInt(standardTime[1]);
            const minutes = standardTime[2] ? parseInt(standardTime[2]) : 0;
            if (hours <= 23 && minutes <= 59) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        
        return null;
    },
    
    // Parse single time with all formats
    parseSingleTime(text) {
        // Standard formats: HH:MM, HH.MM, H:MM, H.MM
        const standardTime = text.match(/^(\d{1,2})[:.](\d{2})$/);
        if (standardTime) {
            const hours = parseInt(standardTime[1]);
            const minutes = parseInt(standardTime[2]);
            if (hours <= 23 && minutes <= 59) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        
        // Time with AM/PM indicators (утра, дня, вечера, ночи)
        const timeWithPeriod = text.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(утра|утром|дня|днем|вечера|вечером|ночи|ночью)$/);
        if (timeWithPeriod) {
            let hours = parseInt(timeWithPeriod[1]);
            const minutes = timeWithPeriod[2] ? parseInt(timeWithPeriod[2]) : 0;
            const period = timeWithPeriod[3];
            
            if ((period === 'дня' || period === 'днем') && hours <= 12) hours += 12;
            if ((period === 'вечера' || period === 'вечером') && hours <= 12) hours += 12;
            if ((period === 'ночи' || period === 'ночью' || period === 'утра' || period === 'утром') && hours === 12) hours = 0;
            
            if (hours <= 23 && minutes <= 59) {
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        
        // Fractional hours (пол, четверть, три четверти)
        const fractionalHours = {
            'пол': 30, 'половина': 30, 'полвина': 30,
            'четверть': 15, 'четвертина': 15,
            'три четверти': 45, 'сорок пять': 45, '45': 45
        };
        
        for (const [fraction, minutes] of Object.entries(fractionalHours)) {
            const patterns = [
                new RegExp(`^${fraction}\\s+(\\w+(?:\\s+\\w+)?)$`),
                new RegExp(`^в\\s+${fraction}\\s+(\\w+(?:\\s+\\w+)?)$`)
            ];
            
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    const hourWord = match[1];
                    const hourNum = this.parseHourWord(hourWord);
                    if (hourNum !== null) {
                        let totalMinutes = (hourNum * 60) + minutes;
                        if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
                        const h = Math.floor(totalMinutes / 60);
                        const m = totalMinutes % 60;
                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    }
                }
            }
        }
        
        // Hour words with "в" (в два, в семь)
        const hourWordWithPrep = text.match(/^в\s+(\w+(?:\s+\w+)?)$/);
        if (hourWordWithPrep) {
            const hourNum = this.parseHourWord(hourWordWithPrep[1]);
            if (hourNum !== null) {
                return `${hourNum.toString().padStart(2, '0')}:00`;
            }
        }
        
        // Hour words (два, три, четыре и т.д.)
        const hourWord = this.parseHourWord(text);
        if (hourWord !== null) {
            return `${hourWord.toString().padStart(2, '0')}:00`;
        }
        
        // Just numbers (assume hours)
        const numberOnly = text.match(/^(\d{1,2})$/);
        if (numberOnly) {
            const hours = parseInt(numberOnly[1]);
            if (hours <= 23) {
                return `${hours.toString().padStart(2, '0')}:00`;
            }
        }
        
        return null;
    },
    
    // Parse hour words (один, два, три, etc.)
    parseHourWord(word) {
        const hourWords = {
            'ноль': 0, 'нуль': 0,
            'один': 1, 'одного': 1, 'первого': 1,
            'два': 2, 'двух': 2, 'второго': 2,
            'три': 3, 'трех': 3, 'третьего': 3,
            'четыре': 4, 'четырех': 4, 'четвертого': 4,
            'пять': 5, 'пяти': 5, 'пятого': 5,
            'шесть': 6, 'шести': 6, 'шестого': 6,
            'семь': 7, 'семи': 7, 'седьмого': 7,
            'восемь': 8, 'восьми': 8, 'восьмого': 8,
            'девять': 9, 'девяти': 9, 'девятого': 9,
            'десять': 10, 'десяти': 10, 'десятого': 10,
            'одиннадцать': 11, 'одиннадцати': 11, 'одиннадцатого': 11,
            'двенадцать': 12, 'двенадцати': 12, 'двенадцатого': 12,
            'тринадцать': 13, 'тринадцати': 13, 'тринадцатого': 13,
            'четырнадцать': 14, 'четырнадцати': 14, 'четырнадцатого': 14,
            'пятнадцать': 15, 'пятнадцати': 15, 'пятнадцатого': 15,
            'шестнадцать': 16, 'шестнадцати': 16, 'шестнадцатого': 16,
            'семнадцать': 17, 'семнадцати': 17, 'семнадцатого': 17,
            'восемнадцать': 18, 'восемнадцати': 18, 'восемнадцатого': 18,
            'девятнадцать': 19, 'девятнадцати': 19, 'девятнадцатого': 19,
            'двадцать': 20, 'двадцати': 20, 'двадцатого': 20,
            'двадцать один': 21, 'двадцать первого': 21,
            'двадцать два': 22, 'двадцать второго': 22,
            'двадцать три': 23, 'двадцать третьего': 23
        };
        
        return hourWords[word.toLowerCase()] || null;
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
        
        // Generate months from current month to end of 2026
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Start from current month and go to December 2026
        for (let year = currentYear; year <= 2026; year++) {
            const startMonth = (year === currentYear) ? currentMonth : 0;
            const endMonth = 11; // December
            
            for (let month = startMonth; month <= endMonth; month++) {
                const monthDiv = this.generateMonth(year, month);
                container.appendChild(monthDiv);
            }
        }
    }
};
