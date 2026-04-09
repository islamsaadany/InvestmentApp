import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import async_session

logger = logging.getLogger(__name__)


async def _check_alerts_job():
    """Background job: check all active price alerts."""
    from app.services.alert_service import check_alerts

    try:
        async with async_session() as db:
            triggered = await check_alerts(db)
            if triggered:
                logger.info(f"Triggered {len(triggered)} price alert(s)")
    except Exception as e:
        logger.error(f"Alert check failed: {e}")


async def _take_snapshot_job():
    """Background job: take daily portfolio snapshot."""
    from app.services.portfolio_service import take_snapshot

    try:
        async with async_session() as db:
            snapshot = await take_snapshot(db)
            logger.info(
                f"Portfolio snapshot: ${snapshot.total_value_usd:,.2f} USD"
            )
    except Exception as e:
        logger.error(f"Snapshot failed: {e}")


def start_scheduler() -> AsyncIOScheduler:
    """Start the background scheduler for alerts and snapshots."""
    scheduler = AsyncIOScheduler()

    # Check alerts every 5 minutes
    scheduler.add_job(_check_alerts_job, "interval", minutes=5, id="check_alerts")

    # Take portfolio snapshot daily at 23:00 UTC
    scheduler.add_job(
        _take_snapshot_job, "cron", hour=23, minute=0, id="daily_snapshot"
    )

    scheduler.start()
    logger.info("Background scheduler started")
    return scheduler


def stop_scheduler(scheduler: AsyncIOScheduler) -> None:
    """Gracefully shut down the scheduler."""
    scheduler.shutdown(wait=False)
    logger.info("Background scheduler stopped")
