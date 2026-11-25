import { runProcess } from './safe-process.util';

describe('runProcess', () => {
  it('runs a short-lived process and captures stdout', async () => {
    const result = await runProcess('node', ['-e', "process.stdout.write('ok')"], 5_000);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('ok');
  });

  it('times out long-running processes', async () => {
    await expect(
      runProcess('node', ['-e', 'setInterval(() => {}, 1_000)'], 200),
    ).rejects.toThrow('PROCESS_TIMEOUT');
  });
});