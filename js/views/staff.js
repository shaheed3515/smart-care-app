(function () {
    window.App.Views.Staff = function () {
        const { state, setView, getRevenue } = window.App.Store;

        const container = document.createElement('div');
        container.className = "min-h-screen bg-slate-50 p-8 animate-fade-in";

        // Stats calc
        const revenue = getRevenue();
        const patients = 128; // Static mock
        const avgWait = "14m";

        container.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <button id="btn-back" class="mb-8 flex items-center text-slate-500 hover:text-blue-600 font-bold transition-colors">
                    <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i> Back to Hub
                </button>

                <header class="mb-10">
                    <h1 class="text-4xl font-black text-slate-900 tracking-tight">Hospital Analytics</h1>
                    <p class="text-slate-500 mt-2">Real-time insights for ${new Date().toLocaleDateString()}</p>
                </header>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-blue-50 text-brand-600 rounded-xl flex items-center justify-center mb-4">
                            <i data-lucide="users" class="w-6 h-6"></i>
                        </div>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Patients</p>
                        <h2 class="text-4xl font-black text-slate-900 mt-1">${patients}</h2>
                        <p class="text-green-500 text-sm font-bold mt-2 flex items-center">
                            <i data-lucide="trending-up" class="w-4 h-4 mr-1"></i> +12%
                        </p>
                    </div>

                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                            <i data-lucide="clock" class="w-6 h-6"></i>
                        </div>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Avg Wait Time</p>
                        <h2 class="text-4xl font-black text-slate-900 mt-1">${avgWait}</h2>
                        <p class="text-red-400 text-sm font-bold mt-2 flex items-center">
                            <i data-lucide="trending-down" class="w-4 h-4 mr-1"></i> +2m vs yest
                        </p>
                    </div>

                     <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                            <i data-lucide="dollar-sign" class="w-6 h-6"></i>
                        </div>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Revenue Forecast</p>
                        <h2 class="text-4xl font-black text-slate-900 mt-1">$${revenue}</h2>
                        <p class="text-green-500 text-sm font-bold mt-2 flex items-center">
                            <i data-lucide="trending-up" class="w-4 h-4 mr-1"></i> +5%
                        </p>
                    </div>

                     <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                            <i data-lucide="activity" class="w-6 h-6"></i>
                        </div>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Pending Cases</p>
                        <h2 class="text-4xl font-black text-slate-900 mt-1">${state.queue.length}</h2>
                        <p class="text-slate-400 text-sm font-bold mt-2">Active Queue</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Simple CSS Bar Chart -->
                    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 class="text-xl font-bold mb-8 text-slate-800">Patient Traffic (Hourly)</h3>
                        <div class="h-64 flex items-end justify-between space-x-4">
                             ${[40, 65, 45, 90, 65, 80, 50].map(h => `
                                <div class="w-full bg-blue-100 hover:bg-brand-600 transition-colors rounded-t-xl relative group" style="height: ${h}%">
                                    <span class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                                        ${h}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex justify-between mt-4 text-xs font-bold text-slate-400 uppercase">
                            <span>8am</span>
                            <span>10am</span>
                            <span>12pm</span>
                            <span>2pm</span>
                            <span>4pm</span>
                            <span>6pm</span>
                            <span>8pm</span>
                        </div>
                    </div>

                    <!-- Heatmap Style Grid -->
                    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 class="text-xl font-bold mb-6 text-slate-800">Department Load</h3>
                        <h3 class="text-xl font-bold mb-6 text-slate-800 flex justify-between items-center">
                            Live Room Status
                            <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded uppercase tracking-wide">Update: Just now</span>
                        </h3>
                        <div class="grid grid-cols-2 gap-4">
                            <!-- Room 1 -->
                            <div class="p-4 border border-red-100 bg-red-50/50 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-red-400 uppercase tracking-wider">OPD-1</p>
                                    <p class="font-bold text-slate-700">Occupied</p>
                                </div>
                                <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                            <!-- Room 2 -->
                            <div class="p-4 border border-green-100 bg-green-50/50 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-green-400 uppercase tracking-wider">OPD-2</p>
                                    <p class="font-bold text-slate-700">Available</p>
                                </div>
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <!-- Room 3 -->
                            <div class="p-4 border border-red-100 bg-red-50/50 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-red-400 uppercase tracking-wider">ER-1</p>
                                    <p class="font-bold text-slate-700">Occupied</p>
                                </div>
                                <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                             <!-- Room 4 -->
                             <div class="p-4 border border-yellow-100 bg-yellow-50/50 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-yellow-600 uppercase tracking-wider">ER-2</p>
                                    <p class="font-bold text-slate-700">Cleaning</p>
                                </div>
                                <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            </div>
                        </div>

                        <div class="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div class="flex items-start">
                                <i data-lucide="alert-triangle" class="text-orange-500 w-5 h-5 mr-3 mt-1"></i>
                                <div>
                                    <h4 class="font-bold text-slate-800">High Load Warning</h4>
                                    <p class="text-sm text-slate-500 mt-1">Cardiology department is approaching capacity. Consider routing non-urgent cases to General Ward.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#btn-back').onclick = () => setView('landing');

        return container;
    };

})();
