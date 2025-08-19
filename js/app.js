// js/app.js
// Main application logic

let app = {
    initialized: false,
    
    // Initialize application
    async init() {
        if (this.initialized) return;
        
        // Initialize Telegram WebApp
        if (!Storage.init()) {
            console.error('Failed to initialize Telegram WebApp');
            alert('Ошибка инициализации Telegram WebApp');
            return;
        }
        
        // Load schedule and electives data
        const scheduleLoaded = await Calendar.loadSchedule();
        const electivesLoaded = await Calendar.loadElectives();
        
        if (!scheduleLoaded || !electivesLoaded) {
            alert('Ошибка загрузки данных расписания');
            return;
        }
        
        // Load saved data from CloudStorage
        try {
            Calendar.selectedElectives = await Storage.loadElectives();
            Calendar.notes = await Storage.loadNotes();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
        
        // Check if electives are selected
        if (Calendar.selectedElectives.length === 0) {
            this.showElectivesModal();
        } else {
            Calendar.render();
        }
        
        this.initialized = true;
    },
    
    // Show electives selection modal
    showElectivesModal() {
        const modal = document.getElementById('electivesModal');
        const list = document.getElementById('electivesList');
        
        list.innerHTML = '';
        
        Calendar.electives.forEach(elective => {
            const item = document.createElement('div');
            item.className = 'elective-item';
            
            const isChecked = Calendar.selectedElectives.includes(elective);
            
            item.innerHTML = `
                <input 
                    type="checkbox" 
                    id="elective_${elective}" 
                    value="${elective}"
                    ${isChecked ? 'checked' : ''}
                >
                <label for="elective_${elective}">${elective}</label>
            `;
            
            list.appendChild(item);
        });
        
        modal.classList.add('active');
    }
};

// Save selected electives
async function saveElectives() {
    const checkboxes = document.querySelectorAll('#electivesList input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);
    
    Calendar.selectedElectives = selected;
    
    try {
        await Storage.saveElectives(selected);
        document.getElementById('electivesModal').classList.remove('active');
        Calendar.render();
    } catch (error) {
        console.error('Error saving electives:', error);
        alert('Ошибка сохранения элективов');
    }
}

// Close day schedule modal
function closeDayModal() {
    document.getElementById('dayModal').classList.remove('active');
}

// Save notes for classes
async function saveNotes() {
    const noteInputs = document.querySelectorAll('.note-input');
    const newNotes = {};
    
    noteInputs.forEach(input => {
        const key = input.dataset.noteKey;
        const value = input.value.trim();
        if (value) {
            newNotes[key] = value;
        }
    });
    
    // Merge with existing notes
    Calendar.notes = { ...Calendar.notes, ...newNotes };
    
    // Remove empty notes
    Object.keys(Calendar.notes).forEach(key => {
        if (!Calendar.notes[key]) {
            delete Calendar.notes[key];
        }
    });
    
    try {
        await Storage.saveNotes(Calendar.notes);
        closeDayModal();
        
        // Show success haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Ошибка сохранения заметок');
    }
}

// Reset electives selection
async function resetElectives() {
    if (confirm('Вы уверены, что хотите изменить выбранные элективы?')) {
        try {
            await Storage.clearElectives();
            Calendar.selectedElectives = [];
            app.showElectivesModal();
            
            // Haptic feedback
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (error) {
            console.error('Error resetting electives:', error);
            alert('Ошибка сброса элективов');
        }
    }
}

// Reset all notes
async function resetNotes() {
    if (confirm('Вы уверены, что хотите удалить все заметки? Это действие нельзя отменить.')) {
        try {
            await Storage.clearNotes();
            Calendar.notes = {};
            alert('Все заметки удалены');
            
            // Haptic feedback
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
            }
        } catch (error) {
            console.error('Error resetting notes:', error);
            alert('Ошибка удаления заметок');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle Telegram WebApp theme changes
if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.onEvent('themeChanged', () => {
        // Theme will be automatically applied through CSS variables
        console.log('Theme changed');
    });
}