// js/storage.js
// Module for working with Telegram CloudStorage

const Storage = {
    // Keys for CloudStorage
    ELECTIVES_KEY: 'selected_electives',
    NOTES_KEY: 'class_notes',

    // Initialize Telegram WebApp
    init() {
        try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            return true;
        } catch (error) {
            console.error('Failed to initialize Telegram WebApp:', error);
            return false;
        }
    },

    // Save data to CloudStorage
    async save(key, value) {
        return new Promise((resolve, reject) => {
            try {
                const data = typeof value === 'string' ? value : JSON.stringify(value);
                window.Telegram.WebApp.CloudStorage.setItem(key, data, (error, result) => {
                    if (error) {
                        console.error('CloudStorage save error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            } catch (error) {
                console.error('Save error:', error);
                reject(error);
            }
        });
    },

    // Load data from CloudStorage
    async load(key) {
        return new Promise((resolve, reject) => {
            try {
                window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                    if (error) {
                        console.error('CloudStorage load error:', error);
                        reject(error);
                    } else {
                        try {
                            const parsed = value ? JSON.parse(value) : null;
                            resolve(parsed);
                        } catch {
                            resolve(value);
                        }
                    }
                });
            } catch (error) {
                console.error('Load error:', error);
                reject(error);
            }
        });
    },

    // Remove data from CloudStorage
    async remove(key) {
        return new Promise((resolve, reject) => {
            try {
                window.Telegram.WebApp.CloudStorage.removeItem(key, (error, result) => {
                    if (error) {
                        console.error('CloudStorage remove error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            } catch (error) {
                console.error('Remove error:', error);
                reject(error);
            }
        });
    },

    // Save selected electives
    async saveElectives(electives) {
        return this.save(this.ELECTIVES_KEY, electives);
    },

    // Load selected electives
    async loadElectives() {
        const electives = await this.load(this.ELECTIVES_KEY);
        return electives || [];
    },

    // Save notes for classes
    async saveNotes(notes) {
        return this.save(this.NOTES_KEY, notes);
    },

    // Load notes for classes
    async loadNotes() {
        const notes = await this.load(this.NOTES_KEY);
        return notes || {};
    },

    // Clear all notes
    async clearNotes() {
        return this.remove(this.NOTES_KEY);
    },

    // Clear selected electives
    async clearElectives() {
        return this.remove(this.ELECTIVES_KEY);
    },

    // Calculate storage size
    async getStorageSize() {
        try {
            const [electives, notes] = await Promise.all([
                this.load(this.ELECTIVES_KEY),
                this.load(this.NOTES_KEY)
            ]);
            
            const electivesSize = electives ? JSON.stringify(electives).length : 0;
            const notesSize = notes ? JSON.stringify(notes).length : 0;
            
            return {
                used: electivesSize + notesSize,
                total: 1024 * 1024, // 1MB limit for CloudStorage
                electivesSize,
                notesSize
            };
        } catch (error) {
            console.error('Error calculating storage:', error);
            return { used: 0, total: 1024 * 1024 };
        }
    },

    // Optimize notes storage (remove old notes)
    async optimizeNotes(daysToKeep = 90) {
        const notes = await this.loadNotes();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const optimizedNotes = {};
        Object.keys(notes).forEach(key => {
            const [dateStr] = key.split('_');
            const [month, day, year] = dateStr.split('/').map(n => parseInt(n));
            const noteDate = new Date(year, month - 1, day);
            
            if (noteDate >= cutoffDate) {
                optimizedNotes[key] = notes[key];
            }
        });
        
        await this.saveNotes(optimizedNotes);
        return Object.keys(notes).length - Object.keys(optimizedNotes).length;
    }
};