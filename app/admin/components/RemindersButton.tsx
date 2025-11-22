"use client";

export default function RemindersButton() {
    return (
        <button
            onClick={() => {
                if (confirm('Send monthly bill reminders to all companies?')) {
                    fetch('/api/cron/monthly-bill', { method: 'POST' })
                        .then(res => res.json())
                        .then(data => alert(data.message))
                        .catch(() => alert('Failed to send reminders'));
                }
            }}
            className="block p-4 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition text-left w-full"
        >
            <h3 className="font-medium text-purple-700">Send Reminders</h3>
            <p className="text-sm text-purple-600 mt-1">Trigger monthly bill emails/SMS.</p>
        </button>
    );
}
