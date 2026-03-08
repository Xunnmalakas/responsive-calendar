let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Load events from localStorage
let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};

function init() {
    renderCalendar();
    renderMobileNav();
    setupSwipe();
    setupKeyboardNav();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('monthTitle');
    const yearDisplay = document.getElementById('yearDisplay');

    monthTitle.textContent = months[currentMonth];
    yearDisplay.textContent = currentYear;
    grid.innerHTML = '';

    // Add day headers
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayCell = createDayCell(daysInPrevMonth - i, true);
        grid.appendChild(dayCell);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentMonth && 
                       today.getFullYear() === currentYear;
        
        const dayCell = createDayCell(day, false, isToday);
        grid.appendChild(dayCell);
    }

    // Next month padding
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayCell = createDayCell(day, true);
        grid.appendChild(dayCell);
    }

    updateMobileNav();
}

function createDayCell(day, isOtherMonth, isToday = false) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');

    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    const dateKey = getDateKey(currentYear, currentMonth, day);
    if (events[dateKey] && events[dateKey].length > 0) {
        const dots = document.createElement('div');
        dots.className = 'event-dots';
        const dotCount = Math.min(events[dateKey].length, 3);
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'event-indicator';
            dots.appendChild(dot);
        }
        cell.appendChild(dots);
    }

    if (!isOtherMonth) {
        cell.onclick = () => openModal(day);
    }

    return cell;
}

function getDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    renderCalendar();
}

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

function renderMobileNav() {
    const nav = document.getElementById('mobileNav');
    nav.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        dot.onclick = () => {
            currentMonth = i;
            renderCalendar();
        };
        nav.appendChild(dot);
    }
}

function updateMobileNav() {
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentMonth);
    });
}

// Modal Functions
function openModal(day) {
    selectedDate = new Date(currentYear, currentMonth, day);
    const dateKey = getDateKey(currentYear, currentMonth, day);
    
    document.getElementById('modalDate').textContent = selectedDate.toLocaleDateString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric' 
    });
    document.getElementById('modalDay').textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const dayEvents = events[dateKey] || [];
    document.getElementById('eventInput').value = dayEvents.join('\n');
    
    document.getElementById('eventModal').style.display = 'block';
    document.getElementById('eventInput').focus();
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    selectedDate = null;
}

function saveEvent() {
    if (!selectedDate) return;
    
    const dateKey = getDateKey(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );
    
    const input = document.getElementById('eventInput').value.trim();
    
    if (input) {
        events[dateKey] = input.split('\n').filter(e => e.trim());
    } else {
        delete events[dateKey];
    }
    
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

function deleteEvent() {
    if (!selectedDate) return;
    
    const dateKey = getDateKey(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );
    
    delete events[dateKey];
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    closeModal();
}

// Swipe support
function setupSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0) {
                changeMonth(-1);
            } else {
                changeMonth(1);
            }
        }
    }
}

// Keyboard navigation
function setupKeyboardNav() {
    document.addEventListener('keydown', e => {
        if (document.getElementById('eventModal').style.display === 'block') {
            if (e.key === 'Escape') closeModal();
            return;
        }
        
        if (e.key === 'ArrowLeft') changeMonth(-1);
        else if (e.key === 'ArrowRight') changeMonth(1);
        else if (e.key === 't' || e.key === 'T') goToToday();
    });
}

window.onclick = function(e) {
    const modal = document.getElementById('eventModal');
    if (e.target === modal) closeModal();
};

// Initialize
init();