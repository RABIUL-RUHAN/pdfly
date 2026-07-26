"""
FR-10: Background sweep that deletes stale files from uploads/ and outputs/.
This is a secondary safety net — the primary deletion happens immediately after
each request via after_this_request in app.py. This handles sessions that ended
abnormally (e.g. the browser closed before the download finished).
"""
import os
import time
import logging

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger("pdfly.cleanup")

MAX_AGE_SECONDS = 30  # 30 seconds


def sweep_directory(path):
    if not os.path.isdir(path):
        return
    now = time.time()
    for name in os.listdir(path):
        if name == ".gitkeep":
            continue
        full_path = os.path.join(path, name)
        try:
            if os.path.isfile(full_path) and (now - os.path.getmtime(full_path)) > MAX_AGE_SECONDS:
                os.remove(full_path)
        except OSError as exc:
            # Permission errors etc. are logged, never surfaced to a user.
            logger.warning("Could not remove stale file %s: %s", full_path, exc)


def sweep_all(upload_dir, output_dir):
    sweep_directory(upload_dir)
    sweep_directory(output_dir)


def start_cleanup_scheduler(upload_dir, output_dir):
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        lambda: sweep_all(upload_dir, output_dir),
        "interval",
        seconds=30,
        id="pdfly_cleanup_sweep",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler