import cron from 'node-cron';

/**
 * Cron Job Scheduler
 * Sets up automated tasks for the application
 */

/**
 * Monthly Billing Cron Job
 * Runs on the last day of every month at 11:59 PM
 * Generates bills for all companies
 */
export function startMonthlyBillingCron() {
    // Schedule: Last day of month at 23:59
    // Cron expression: '59 23 28-31 * *'
    // This runs at 23:59 on days 28-31 of every month
    // We check if it's actually the last day inside the job
    console.log('[CRON] Starting monthly billing cron job...');
    const job = cron.schedule('59 23 28-31 * *', async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if tomorrow is the 1st (meaning today is the last day of the month)
        if (tomorrow.getDate() === 1) {
            console.log('[CRON] Running monthly billing job...');

            try {
                const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/monthly-billing`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.CRON_SECRET}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('[CRON] Monthly billing completed:', result);
                } else {
                    console.error('[CRON] Monthly billing failed:', await response.text());
                }
            } catch (error) {
                console.error('[CRON] Error running monthly billing:', error);
            }
        }
    });

    console.log('[CRON] Monthly billing cron job started');
    return job;
}

/**
 * Payment Reminder Cron Job
 * Runs daily at 10:00 AM
 * Sends reminders for pending payments
 */
export function startPaymentReminderCron() {
    // Schedule: Every day at 10:00 AM
    const job = cron.schedule('0 10 * * *', async () => {
        console.log('[CRON] Running payment reminder job...');

        try {
            // TODO: Create a separate API endpoint for payment reminders
            // This would fetch all pending bills with due dates approaching
            // and send reminder emails

            console.log('[CRON] Payment reminder job completed');
        } catch (error) {
            console.error('[CRON] Error running payment reminder:', error);
        }
    });

    console.log('[CRON] Payment reminder cron job started');
    return job;
}

/**
 * Start all cron jobs
 */
export function startAllCronJobs() {
    console.log('[CRON] Starting all cron jobs...');

    const jobs = {
        monthlyBilling: startMonthlyBillingCron(),
        paymentReminder: startPaymentReminderCron(),
    };

    console.log('[CRON] All cron jobs started successfully');
    return jobs;
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(jobs: any) {
    console.log('[CRON] Stopping all cron jobs...');

    Object.values(jobs).forEach((job: any) => {
        if (job && typeof job.stop === 'function') {
            job.stop();
        }
    });

    console.log('[CRON] All cron jobs stopped');
}
