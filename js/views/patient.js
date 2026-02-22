(function () {
    window.App.Views.Patient = function () {
        const { state, setStep, updatePatientData, setView } = window.App.Store;

        const container = document.createElement('div');
        container.className = "min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-fade-in";

        // --- API HELPERS ---
        const { getCoordinates, getNearbyHospitals } = window.App.API;

        // --- MAP CONTROLLER ---
        let map = null;
        let userMarker = null;
        let hospitalLayer = null;
        let watchId = null;

        const initMap = (lat, lng) => {
            if (map) return; // Already initialized

            console.log("[Map] Initializing...");
            map = L.map('hospital-map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OSM Contributors'
            }).addTo(map);

            hospitalLayer = L.layerGroup().addTo(map);
        };

        const updateUserMarker = (lat, lng) => {
            if (!map) return;

            // Create or Move User Marker
            if (!userMarker) {
                const icon = L.divIcon({
                    className: 'bg-blue-600 w-4 h-4 rounded-full border-2 border-white shadow-lg pulse',
                    iconSize: [16, 16]
                });
                userMarker = L.marker([lat, lng], { icon: icon }).addTo(map).bindPopup("You").openPopup();
            } else {
                userMarker.setLatLng([lat, lng]);
            }

            // Smooth Pan
            map.flyTo([lat, lng], 13);
        };

        const renderHospitalMarkers = (hospitals) => {
            if (!map || !hospitalLayer) return;

            hospitalLayer.clearLayers(); // Remove old markers
            console.log(`[Map] Rendering ${hospitals.length} markers`);

            const icon = L.divIcon({
                className: 'bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-lg',
                iconSize: [16, 16]
            });

            hospitals.forEach(h => {
                L.marker([h.lat, h.lng], { icon: icon })
                    .addTo(hospitalLayer)
                    .bindPopup(`<b>${h.name}</b><br>${h.type}`);
            });
        };


        // --- UI RENDER HELPERS ---
        const renderHospitalList = (hospitals) => {
            const listContainer = container.querySelector('#hospital-list');
            if (!listContainer) return;

            if (hospitals.length > 0) {
                listContainer.innerHTML = hospitals.map((h, index) => {
                    const colors = ['green', 'blue', 'purple', 'orange'];
                    const color = colors[index % colors.length];
                    return `
                    <div class="hospital-card cursor-pointer bg-white p-5 border border-slate-100 rounded-2xl hover:border-brand-500 hover:shadow-md transition-all flex justify-between items-center group mb-4" 
                         data-name="${h.name}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-${color}-100 text-${color}-600 rounded-full flex items-center justify-center mr-5 shrink-0">
                                <i data-lucide="activity" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg text-slate-800 group-hover:text-brand-600">${h.name}</h3>
                                <p class="text-sm text-slate-500 capitalize">${h.type} • ${(Math.random() * 5 + 0.5).toFixed(1)} km</p>
                            </div>
                        </div>
                        <span class="px-3 py-1 bg-${color}-50 text-${color}-700 rounded-full text-xs font-bold uppercase tracking-wide">Select</span>
                    </div>`;
                }).join('');

                // Re-attach listeners
                container.querySelectorAll('.hospital-card').forEach(card => {
                    card.onclick = () => {
                        updatePatientData('hospital', card.dataset.name);
                        setStep(4);
                    };
                });

            } else {
                listContainer.innerHTML = `
                    <div class="p-8 text-center text-slate-500">
                        <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                        <p>No hospitals found nearby.</p>
                    </div>
                `;
            }
        };


        // --- LOGIC: LIVE TRACKING ---
        const startLiveTracking = () => {
            if (!navigator.geolocation) {
                alert("Geolocation not supported.");
                return;
            }

            console.log("[GPS] Starting Watcher...");

            // Initial "Loading" state if needed

            watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log(`[GPS] Update: ${latitude}, ${longitude}`);

                    // If we are on Step 3, update map
                    if (state.step === 3) {
                        updateUserMarker(latitude, longitude);

                        // Fetch new data (debounced ideally, but here distinct)
                        // For now, simpler: Just update marker. Real refresh could be button or threshold.
                        // Let's Refresh hospitals on significant move?
                        // For simplicity, we fetch once on entry.
                    } else if (state.step === 2) {
                        // First Lock -> Go to Step 3
                        const data = await getNearbyHospitals(latitude, longitude);
                        state.tempHospitals = data.results;
                        state.searchRadius = data.radius;
                        state.userCoords = { lat: latitude, lng: longitude };
                        updatePatientData('area', 'Live Location');
                        setStep(3);
                    }
                },
                (err) => console.error("[GPS] Error", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };


        // --- VIEW TEMPLATES ---
        let contentHTML = '';

        // Progress UI
        const steps = [1, 2, 3, 4, 5, 6];
        const progressHTML = `
            <div class="flex justify-between w-full max-w-lg mb-10 relative">
                <div class="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
                ${steps.map(s => `
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-500 ${state.step >= s ? 'bg-brand-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-200 text-slate-400'}">
                        ${s}
                    </div>
                `).join('')}
            </div>
        `;

        // STEP 1: PATIENT DETAILS (NEW)
        if (state.step === 1) {
            contentHTML = `
                <div class="space-y-6 w-full animate-fade-in">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-slate-800">Patient Details</h2>
                        <p class="text-slate-500">Tell us a bit about who needs care.</p>
                    </div>

                    <div class="space-y-4">
                        <!-- Name -->
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                            <input id="input-name" type="text" class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                                placeholder="e.g. John Doe" value="${state.patientData.name}">
                        </div>

                        <!-- Age & Gender -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-1">Age</label>
                                <input id="input-age" type="number" class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" 
                                    placeholder="e.g. 30" value="${state.patientData.age}">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-1">Gender</label>
                                <select id="input-gender" class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                                    <option value="" disabled ${!state.patientData.gender ? 'selected' : ''}>Select</option>
                                    <option value="Male" ${state.patientData.gender === 'Male' ? 'selected' : ''}>Male</option>
                                    <option value="Female" ${state.patientData.gender === 'Female' ? 'selected' : ''}>Female</option>
                                    <option value="Other" ${state.patientData.gender === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>

                        <!-- Doctor Preference -->
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Doctor Preference</label>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="cursor-pointer border ${state.patientData.doctorPref === 'Male' ? 'border-brand-500 bg-blue-50' : 'border-slate-200'} rounded-xl p-3 flex items-center justify-center transition-all hover:bg-slate-50" onclick="document.getElementById('pref-male').click()">
                                    <input type="radio" name="doctorPref" id="pref-male" value="Male" class="hidden" ${state.patientData.doctorPref === 'Male' ? 'checked' : ''}>
                                    <span class="font-medium text-slate-700">👨‍⚕️ Male Doctor</span>
                                </label>
                                <label class="cursor-pointer border ${state.patientData.doctorPref === 'Female' ? 'border-brand-500 bg-blue-50' : 'border-slate-200'} rounded-xl p-3 flex items-center justify-center transition-all hover:bg-slate-50" onclick="document.getElementById('pref-female').click()">
                                    <input type="radio" name="doctorPref" id="pref-female" value="Female" class="hidden" ${state.patientData.doctorPref === 'Female' ? 'checked' : ''}>
                                    <span class="font-medium text-slate-700">👩‍⚕️ Female Doctor</span>
                                </label>
                            </div>
                            <label class="cursor-pointer border ${state.patientData.doctorPref === 'Any' ? 'border-brand-500 bg-blue-50' : 'border-slate-200'} rounded-xl p-3 flex items-center justify-center transition-all hover:bg-slate-50 mt-2" onclick="document.getElementById('pref-any').click()">
                                <input type="radio" name="doctorPref" id="pref-any" value="Any" class="hidden" ${state.patientData.doctorPref === 'Any' ? 'checked' : ''}>
                                <span class="font-medium text-slate-700">No Preference</span>
                            </label>
                        </div>
                    </div>

                    <button id="btn-next-step1" class="w-full bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all">
                        Next: Find Hospitals <i data-lucide="arrow-right" class="w-5 h-5 inline ml-1"></i>
                    </button>
                </div>
            `;
        }

        // STEP 2: CHOICE (Was Step 1)
        if (state.step === 2) {
            contentHTML = `
                <div class="space-y-8 w-full animate-fade-in">
                    <div class="text-center">
                        <h2 class="text-3xl font-bold text-slate-800">Where are you?</h2>
                        <p class="text-slate-500">Choose how to find hospitals near you.</p>
                    </div>

                    <!-- Option A: Live -->
                    <button id="btn-live" class="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 p-6 rounded-2xl flex items-center transition-all group text-left">
                        <div class="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center mr-5 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                            <i data-lucide="crosshair" class="w-7 h-7"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg text-slate-800">Use Live Location</h3>
                            <p class="text-slate-500 text-sm">Automatically find nearest hospitals using GPS</p>
                        </div>
                    </button>

                    <div class="relative flex items-center w-full my-4">
                        <div class="h-px bg-slate-200 w-full"></div>
                        <span class="px-4 text-xs font-bold text-slate-400 uppercase">OR</span>
                        <div class="h-px bg-slate-200 w-full"></div>
                    </div>

                    <!-- Option B: Manual -->
                    <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h3 class="font-bold text-slate-800 mb-4">Enter Manual Address</h3>
                        <div class="flex gap-2">
                            <input id="input-manual" type="text" placeholder="e.g. Kurnool, Andhra Pradesh" 
                                class="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                            <button id="btn-search" class="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                                <i data-lucide="search" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // STEP 3: MAP & LIST (Was Step 2)
        if (state.step === 3) {
            contentHTML = `
                <div class="space-y-4 w-full animate-fade-in">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">Nearby Hospitals</h2>
                            ${state.searchRadius && state.searchRadius > 5000 ?
                    `<p class="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded inline-block mt-1">
                                    <i data-lucide="alert-circle" class="w-3 h-3 inline mr-1"></i> Expanded search to ${state.searchRadius / 1000}km
                                </p>` :
                    `<p class="text-xs text-slate-400">Within ${state.searchRadius ? state.searchRadius / 1000 : 5}km radius</p>`
                }
                        </div>
                        <button id="btn-change-loc" class="text-sm font-bold text-brand-600 hover:text-brand-800">Change Location</button>
                    </div>
                    
                    <!-- Map Container -->
                    <div id="hospital-map" class="w-full h-64 rounded-2xl bg-slate-100 z-0 border border-slate-200 shadow-inner"></div>

                    <!-- List Container -->
                    <div id="hospital-list" class="max-h-80 overflow-y-auto pr-2 pt-2">
                        <!-- Items injected by JS -->
                        <div class="p-4 text-center text-slate-400">Loading hospitals...</div>
                    </div>
                </div>
            `;
        }

        // STEP 4: SYMPTOMS (Was Step 3, removed Age)
        if (state.step === 4) {
            const quickSymptoms = ["Fever", "Headache", "Cough", "Cold", "Body Pain", "Fatigue", "Nausea"];

            contentHTML = `
                <div class="space-y-4 w-full animate-fade-in">
                    <h2 class="text-3xl font-bold text-slate-800">Tell us your symptoms</h2>
                    
                    <div class="space-y-4">
                        <textarea id="input-symptoms" class="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Describe what you are feeling..." rows="4">${state.patientData.symptoms}</textarea>
                        
                        <!-- Quick Select Chips -->
                        <div class="flex flex-wrap gap-2">
                            ${quickSymptoms.map(s => `
                                <button class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-medium transition-colors"
                                    onclick="const el = document.getElementById('input-symptoms'); el.value += (el.value ? ', ' : '') + '${s}'; el.dispatchEvent(new Event('input'));">
                                    + ${s}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <button id="btn-next" class="w-full bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all mt-4">Next</button>
                </div>`;
        }

        // STEP 5: QUOTE (Was Step 4)
        if (state.step === 5) {
            contentHTML = `<div class="w-full text-center">
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl mb-8 border border-blue-100 relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-200/20 rounded-full blur-2xl"></div>
                    <p class="text-slate-500 uppercase tracking-widest text-xs font-bold mb-2">Estimated Fee</p>
                    <h3 class="text-5xl md:text-6xl font-black text-brand-900 tracking-tighter">₹75.00</h3>
                    <p class="text-slate-400 text-sm mt-4">Includes Consultation & Basic Triage</p>
                </div>
                <!-- Summary of Details -->
                <div class="bg-slate-50 p-4 rounded-xl text-left text-sm text-slate-600 mb-4">
                    <p><strong>Patient:</strong> ${state.patientData.name} (${state.patientData.age}, ${state.patientData.gender})</p>
                    <p><strong>Doctor Pref:</strong> ${state.patientData.doctorPref}</p>
                    <p><strong>Hospital:</strong> ${state.patientData.hospital}</p>
                </div>
                <button id="btn-next" class="w-full bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all">
                    Confirm & Get Token
                </button>
             </div>`;
        }

        // STEP 6: CONFIRM (Was Step 5)
        if (state.step === 6) {
            const randomToken = `#${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(10 + Math.random() * 90)}`;
            const randomWait = Math.floor(5 + Math.random() * 25);

            contentHTML = `
                <div class="w-full text-center p-10 bg-green-50 rounded-3xl border-2 border-green-100 animate-fade-in">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i data-lucide="check" class="w-10 h-10"></i>
                    </div>
                    <p class="font-bold text-green-800 text-xl">Booking Confirmed!</p>
                    <h1 class="text-6xl md:text-7xl font-black text-green-700 my-6 tracking-tighter">${randomToken}</h1>
                    <div class="bg-white/50 p-4 rounded-xl inline-block text-left w-full mt-4">
                         <div class="grid grid-cols-2 gap-2 text-sm">
                            <p class="text-slate-500">Patient:</p> <p class="font-bold text-slate-900 text-right">${state.patientData.name}</p>
                            <p class="text-slate-500">Hospital:</p> <p class="font-bold text-slate-900 text-right truncate">${state.patientData.hospital}</p>
                            <p class="text-slate-500">Wait Time:</p> <p class="font-bold text-green-600 text-right">~${randomWait} Mins</p>
                            <p class="text-slate-500">Doctor:</p> <p class="font-bold text-slate-900 text-right">${state.patientData.doctorPref === 'Any' ? 'Any Available' : state.patientData.doctorPref}</p>
                         </div>
                    </div>
                    <button id="btn-home" class="w-full mt-8 bg-white border border-green-200 text-green-700 hover:bg-green-100 p-4 rounded-xl font-bold text-lg transition-all">
                        Back to Home
                    </button>
                </div>
            `;
        }

        // Render Container
        const backBtn = `
            <button id="btn-back" class="absolute top-6 left-6 flex items-center text-slate-500 hover:text-brand-600 font-bold transition-colors">
                <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i> Back
            </button>`;

        container.innerHTML = `
            ${backBtn}
            <div class="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white">
                ${progressHTML}
                ${contentHTML}
            </div>
        `;

        // Event Listeners
        container.querySelector('#btn-back').onclick = () => {
            // Cleanup
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (state.step === 1) setView('landing');
            else setStep(state.step - 1);
        };

        // --- STEP 1 HANDLERS (Details) ---
        if (state.step === 1) {
            container.querySelector('#input-name').oninput = (e) => updatePatientData('name', e.target.value);
            container.querySelector('#input-age').oninput = (e) => updatePatientData('age', e.target.value);
            container.querySelector('#input-gender').onchange = (e) => updatePatientData('gender', e.target.value);

            // Radio buttons for doctorPref
            const prefs = container.querySelectorAll('input[name="doctorPref"]');
            prefs.forEach(p => {
                p.onchange = () => {
                    updatePatientData('doctorPref', p.value);
                    setStep(1); // Re-render to show selection style
                };
            });

            container.querySelector('#btn-next-step1').onclick = () => {
                const { name, age, gender } = state.patientData;
                if (!name || !age || !gender) {
                    alert("Please fill in all fields.");
                    return;
                }
                setStep(2);
            };
        }

        // --- STEP 2 HANDLERS (Location) ---
        if (state.step === 2) {
            // Live Button
            container.querySelector('#btn-live').onclick = () => {
                const btn = container.querySelector('#btn-live');
                btn.innerHTML = `<div class="animate-spin mr-3"><i data-lucide="loader-2"></i></div> Searching...`;
                startLiveTracking();
            };

            // Manual Search
            const searchBtn = container.querySelector('#btn-search');
            const input = container.querySelector('#input-manual');
            const doManualSearch = async () => {
                const query = input.value;
                if (!query) return;
                searchBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i>`;
                const coords = await getCoordinates(query);
                if (coords) {
                    const data = await getNearbyHospitals(coords.lat, coords.lng);
                    state.tempHospitals = data.results;
                    state.searchRadius = data.radius;
                    state.userCoords = coords;
                    updatePatientData('area', query);
                    setStep(3); // Go to Step 3 (Map)
                } else {
                    alert("Location not found");
                    searchBtn.innerHTML = `<i data-lucide="search"></i>`;
                }
            };
            searchBtn.onclick = doManualSearch;
        }

        // --- STEP 3 HANDLERS (Map) ---
        if (state.step === 3) {
            setTimeout(() => {
                if (state.userCoords) {
                    initMap(state.userCoords.lat, state.userCoords.lng);
                    updateUserMarker(state.userCoords.lat, state.userCoords.lng);
                    renderHospitalMarkers(state.tempHospitals || []);
                }
            }, 100);
            renderHospitalList(state.tempHospitals || []);
            container.querySelector('#btn-change-loc').onclick = () => {
                if (watchId) navigator.geolocation.clearWatch(watchId);
                setStep(2);
            };
        }

        // --- OTHER STEPS ---
        if (state.step === 4) {
            container.querySelector('#input-symptoms').oninput = (e) => updatePatientData('symptoms', e.target.value);
            container.querySelector('#btn-next').onclick = () => setStep(5);
        }
        if (state.step === 5) {
            container.querySelector('#btn-next').onclick = async () => {
                const btn = container.querySelector('#btn-next');
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-5 h-5 inline mr-2"></i> Processing...`;
                lucide.createIcons();

                try {
                    await window.App.DB.addPatient(state.patientData);
                    setStep(6);
                } catch (e) {
                    const errorMsg = e.message || e.details || "Unknown error";
                    alert(`Failed to confirm booking: ${errorMsg}\n\nPlease ensure you have run the SQL setup script in your Supabase dashboard.`);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    lucide.createIcons();
                }
            };
        }
        if (state.step === 6) container.querySelector('#btn-home').onclick = () => setView('landing');

        return container;
    };
})();
