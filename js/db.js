(function () {
    // Supabase Configuration - Placeholder
    // REPLACE these values with your actual Supabase project URL and Anon Key
    const SUPABASE_URL = "https://vgrfkqjltneukjdqaupr.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncmZrcWpsdG5ldWtqZHFhdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjczMzcsImV4cCI6MjA4NzI0MzMzN30.KO8lfvwwp9E22pghXH1B-jbhu_YXzO54MJFwVXq6ZCk";

    // Initialize Supabase Client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const DB = {
        /**
         * Fetch current queue once
         */
        fetchQueue: async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Supabase Fetch Error:", error);
                return [];
            }
            return data;
        },

        /**
         * Listen for real-time updates to the patient queue
         * @param {Function} onUpdate - Function to call when queue changes
         */
        listenToQueue: (onUpdate) => {
            const channel = supabase.channel('public:queue')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'queue'
                }, async (payload) => {
                    console.log('Change received!', payload);
                    // Fetch full queue to maintain consistency and order
                    const queue = await DB.fetchQueue();
                    onUpdate(queue);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        },

        /**
         * Add a patient to the queue
         * @param {Object} patientData - The patient data to store
         */
        addPatient: async (patientData) => {
            try {
                // Prepare data for storage
                const data = {
                    name: patientData.name,
                    age: parseInt(patientData.age),
                    gender: patientData.gender,
                    doctor_pref: patientData.doctorPref,
                    area: patientData.area,
                    symptoms: patientData.symptoms,
                    hospital: patientData.hospital,
                    triage: patientData.triage || "Green",
                    fee: patientData.fee || 75,
                    problem: patientData.symptoms || "Unknown"
                };

                const { data: insertedData, error } = await supabase
                    .from('queue')
                    .insert([data])
                    .select();

                if (error) {
                    console.error("Supabase Insert Error:", error);
                    throw error;
                }
                console.log("Patient added:", insertedData);
                return insertedData[0].id;
            } catch (e) {
                console.error("Error adding patient: ", e);
                throw e; // Rethrow to be caught by the UI
            }
        },

        /**
         * Update an existing patient in the queue
         * @param {string|number} id - Record ID
         * @param {Object} updates - Data to update
         */
        updatePatient: async (id, updates) => {
            try {
                const { error } = await supabase
                    .from('queue')
                    .update(updates)
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                console.error("Error updating patient: ", e);
                throw e;
            }
        },

        /**
         * Remove a patient from the queue
         * @param {string|number} id - Record ID
         */
        removePatient: async (id) => {
            try {
                const { error } = await supabase
                    .from('queue')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                console.error("Error removing patient: ", e);
                throw e;
            }
        }
    };

    window.App.DB = DB;
})();
