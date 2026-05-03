import { JobQueueService } from "../src/common/job-queue/job-queue.service";

describe("JobQueueService", () => {
  it("claims and completes due jobs with the registered handler", async () => {
    const job = {
      id: "job-1",
      type: "demo.task",
      payload: {
        value: 1
      },
      attempts: 1,
      maxAttempts: 3
    };
    const repository = {
      claimNext: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null),
      complete: vi.fn().mockResolvedValue({
        ...job,
        status: "SUCCEEDED"
      }),
      fail: vi.fn()
    } as any;
    const service = new JobQueueService(repository);
    const handler = vi.fn().mockResolvedValue({ ok: true });

    service.registerHandler("demo.task", handler);
    const result = await service.runDueJobs(["demo.task"]);

    expect(repository.claimNext).toHaveBeenCalledWith(["demo.task"]);
    expect(handler).toHaveBeenCalledWith(job);
    expect(repository.complete).toHaveBeenCalledWith("job-1", { ok: true });
    expect(result).toEqual([
      expect.objectContaining({
        status: "SUCCEEDED"
      })
    ]);
  });

  it("marks jobs failed when a handler throws", async () => {
    const job = {
      id: "job-1",
      type: "demo.task",
      payload: {},
      attempts: 1,
      maxAttempts: 3
    };
    const repository = {
      claimNext: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null),
      complete: vi.fn(),
      fail: vi.fn().mockResolvedValue({
        ...job,
        status: "PENDING",
        errorMessage: "boom"
      })
    } as any;
    const service = new JobQueueService(repository);

    service.registerHandler("demo.task", vi.fn().mockRejectedValue(new Error("boom")));
    await service.runDueJobs(["demo.task"]);

    expect(repository.fail).toHaveBeenCalledWith(job, "boom");
    expect(repository.complete).not.toHaveBeenCalled();
  });
});
