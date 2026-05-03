from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.events import EVENT_JOB_ERROR
from database.scheduler_db_handler import SchedulerDatabaseHandler
from database.db_handler import DatabaseHandler
import logging

logger = logging.getLogger(__name__)


class SchedulerProcessor:
    """Handles scheduled background jobs (Import Timeout Watchdog)"""

    def __init__(self):
        self.db_handler = DatabaseHandler()
        self.scheduler_db_handler = SchedulerDatabaseHandler()
        self.scheduler = None 

    def start_import_timeout_scheduler(self):
        logger.info("🚀 Starting import timeout scheduler")
        logger.warning("WATCHDOG STARTED")
        if self.scheduler and self.scheduler.running:
            logger.info("Scheduler already running. Skipping restart.")
            return

        try:
            executors = {
                "default": ThreadPoolExecutor(5)
            }

            # Create scheduler
            self.scheduler = BackgroundScheduler(
                executors=executors,
                timezone="UTC",
                daemon=False
            )

            logger.info("Scheduler object created")

            # ✅ Correct way — pass function reference directly
            self.scheduler.add_job(
                self.scheduler_db_handler.mark_stuck_imports_failed,
                trigger="interval",
                minutes=60,
                id="import_timeout_watchdog",
                replace_existing=True,
                max_instances=1,
                coalesce=True
            )

            logger.info("Job added successfully")

            # Optional: log scheduler job errors
            def job_error_listener(event):
                logger.error(f"❌ Scheduler job crashed: {event.exception}")

            self.scheduler.add_listener(job_error_listener, EVENT_JOB_ERROR)

            # Start scheduler
            self.scheduler.start()

            logger.info(f"Scheduler running: {self.scheduler.running}")
            logger.info(f"Registered jobs: {self.scheduler.get_jobs()}")
            logger.info("✅ Import timeout scheduler started successfully")
            logger.warning("WATCHDOG FINISHED")


        except Exception as e:
            logger.exception("❌ Failed to start import timeout scheduler")
            raise
