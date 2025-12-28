const CORRECT_PIN = "1234";

document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const pinInput = document.getElementById('pin-input');
    const loginBtn = document.getElementById('login-btn');
    const tableBody = document.querySelector('#appointments-table tbody');

    // Login Logic
    loginBtn.addEventListener('click', () => {
        if (pinInput.value === CORRECT_PIN) {
            loginOverlay.style.display = 'none';
            dashboardContent.style.display = 'block';
            fetchAppointments();
        } else {
            alert('Incorrect PIN!');
            pinInput.value = '';
        }
    });

    // Fetch Appointments
    async function fetchAppointments() {
        try {
            const response = await fetch('/.netlify/functions/appointments');
            const appointments = await response.json();
            renderTable(appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            alert('Failed to load data');
        }
    }

    // Render Table
    function renderTable(appointments) {
        tableBody.innerHTML = '';

        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No appointments found.</td></tr>';
            return;
        }

        // Sort by newest first
        appointments.sort((a, b) => b.id - a.id);

        appointments.forEach(appt => {
            const date = new Date(appt.date).toLocaleDateString() + ' ' + new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${appt.name}</td>
                <td>${appt.phone}</td>
                <td>${appt.reason}</td>
                <td>
                    <button class="btn-delete" onclick="deleteAppointment('${appt._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Delete Appointment (Global function for onclick)
    window.deleteAppointment = async (id) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        try {
            const response = await fetch(`/.netlify/functions/delete-appointment/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                fetchAppointments(); // Refresh table
            } else {
                alert('Error deleting: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
});
