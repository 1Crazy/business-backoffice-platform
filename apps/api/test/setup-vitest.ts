import "reflect-metadata";

import { vi } from "vitest";

// 迁移期兼容层：保留现有 `jest.fn()/spyOn()` 写法，避免一次性重写所有测试。
Object.assign(globalThis, {
  jest: vi
});
