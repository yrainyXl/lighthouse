import { CronJob } from 'cron';

interface SchedulerService {
  scheduleDailyTask: (task: () => Promise<void>, time: string) => CronJob;
}

export class SchedulerServiceImpl implements SchedulerService {
  scheduleDailyTask(task: () => Promise<void>, time: string): CronJob {
    // 格式: 秒 分 时 日 月 周
    // 例如: '0 0 8 * * *' 表示每天早上8点执行
    const job = new CronJob(time, async () => {
      try {
        await task();
        console.log('Daily task executed successfully');
      } catch (error) {
        console.error('Error executing daily task:', error);
      }
    });

    job.start();
    console.log(`Scheduled daily task at ${time}`);
    return job;
  }
}

export default SchedulerServiceImpl;