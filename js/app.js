(function () {
    const { state, subscribe } = window.App.Store;
    const { Landing, Patient, Doctor, Staff, Login } = window.App.Views;

    const app = document.getElementById('app');

    function render() {
        // --- Focus & Cursor Preservation ---
        const activeElementId = document.activeElement ? document.activeElement.id : null;
        let selectionStart = null;
        let selectionEnd = null;

        if (activeElementId && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            selectionStart = document.activeElement.selectionStart;
            selectionEnd = document.activeElement.selectionEnd;
        }

        app.innerHTML = '';
        let viewComponent;

        switch (state.view) {
            case 'landing':
                viewComponent = Landing();
                break;
            case 'patient':
                viewComponent = Patient();
                break;
            case 'doctor':
                viewComponent = Doctor();
                break;
            case 'staff':
                viewComponent = Staff();
                break;
            case 'login':
                viewComponent = Login();
                break;
            default:
                viewComponent = Landing();
        }

        app.appendChild(viewComponent);

        // --- Restore Focus & Cursor ---
        if (activeElementId) {
            const element = document.getElementById(activeElementId);
            if (element) {
                element.focus();
                if (selectionStart !== null && selectionEnd !== null) {
                    element.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }

        // Re-initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Initial Render
    render();

    // Subscribe to state changes
    subscribe(() => {
        render();
    });
})();
