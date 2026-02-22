(function () {
    const state = {
        view: 'landing', // landing, patient, doctor, staff
        step: 1,
        patientData: {
            name: '',
            age: '',
            gender: '', // 'male', 'female', 'other'
            doctorPref: '', // 'male', 'female', 'any'
            area: '',
            symptoms: '',
            hospital: ''
        },
        queue: [] // Now populated from DB
    };

    const listeners = [];

    function subscribe(callback) {
        listeners.push(callback);
    }

    function notify() {
        listeners.forEach(cb => cb(state));
    }

    // Actions
    function setView(newView) {
        state.view = newView;
        if (newView === 'landing') {
            state.step = 1;
            // Clear patient data on return to landing
            state.patientData = {
                name: '', age: '', gender: '', doctorPref: '', area: '', symptoms: '', hospital: ''
            };
        }
        notify();
    }

    function setStep(newStep) {
        state.step = newStep;
        notify();
    }

    function setAuthTarget(role) {
        // Role: 'doctor' or 'staff'
        state.auth = state.auth || {};
        state.auth.targetRole = role;
    }

    function updatePatientData(key, value, silent = false) {
        state.patientData[key] = value;
        if (!silent) notify(); // Ensure UI reflects changes immediately
    }

    function updateQueue(newQueue) {
        state.queue = newQueue;
        notify();
    }

    function getRevenue() {
        return state.queue.reduce((acc, curr) => acc + (curr.fee || 0), 0);
    }

    // Initialize Database Sync
    function initSync() {
        // Initial Fetch
        window.App.DB.fetchQueue().then(queue => {
            updateQueue(queue);
        });

        // Real-time listener
        window.App.DB.listenToQueue(queue => {
            updateQueue(queue);
        });
    }

    // Wait for DB to be available
    if (window.App.DB) {
        initSync();
    } else {
        window.addEventListener('load', () => {
            if (window.App.DB) initSync();
        });
    }

    // Expose to Global App Namespace
    window.App.Store = {
        state,
        subscribe,
        setView,
        setStep,
        setAuthTarget,
        updatePatientData,
        getRevenue
    };
})();
