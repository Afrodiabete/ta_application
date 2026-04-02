// ==========================================
// MAIN APP
// ==========================================
const App = {
    // USER_ROLE is set as a window global by Django in dashboard.html
    role: window.USER_ROLE || 'student',

    init() {
        document.getElementById('year-display').innerText = new Date().getFullYear();

        // Wire up admin role-switch buttons (only rendered for admin users)
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                App.role = btn.dataset.role;
                App.render();
            });
        });

        this.render();
    },

    render() {
        const labels = {
            admin: "Administrative Officer – Review",
            faculty: "Faculty – Evaluate TA",
            student: "Student – TA Application"
        };
        document.getElementById('app-title').innerText = labels[this.role];

        // Update active state on role-switch buttons
        document.querySelectorAll('.role-btn').forEach(btn => {
            const isActive = btn.dataset.role === this.role;
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('shadow', isActive);
            btn.classList.toggle('text-gray-900', isActive);
            btn.classList.toggle('text-gray-500', !isActive);
        });

        // Render Content
        const container = document.getElementById('main-container');
        container.innerHTML = '';

        if (this.role === 'admin')        AdminController.render(container);
        else if (this.role === 'faculty') FacultyController.render(container);
        else if (this.role === 'student') StudentController.render(container);
    }
};

// Start App
App.init();
