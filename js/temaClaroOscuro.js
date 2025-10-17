// ===== FUNCIONALIDAD DEL SWITCH DE TEMA =====
document.addEventListener('DOMContentLoaded', function() { 
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]'); // Selector del switch
    const currentTheme = localStorage.getItem('theme'); // Obtener tema guardado

    // Función para cambiar el tema
    function switchTheme(e) {
        if (e.target.checked) { // Si el switch está activado, aplicar tema oscuro
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else { // Si el switch está desactivado, aplicar tema claro
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    }

    // Event listener para el switch
    toggleSwitch.addEventListener('change', switchTheme);

    // Aplicar tema guardado o detectar preferencia del sistema
    if (currentTheme) {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(currentTheme + '-mode');
        
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    } else {
        // Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            toggleSwitch.checked = true;
            localStorage.setItem('theme', 'dark');
        }
    }
});