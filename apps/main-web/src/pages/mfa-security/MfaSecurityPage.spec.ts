// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MfaSecurityPage from "@/pages/mfa-security/MfaSecurityPage.vue";

const { getMock, postMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock
  }
}));

vi.mock("element-plus", async () => {
  const actual = await vi.importActual<typeof import("element-plus")>("element-plus");

  return {
    ...actual,
    ElMessage: {
      success: successMock,
      error: errorMock
    }
  };
});

const globalStubs = {
  "el-input": true,
  "el-button": true,
  "el-tag": true
};

describe("MfaSecurityPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();

    getMock.mockResolvedValue({
      data: {
        enabled: true,
        pending: false,
        configuredAt: "2026-05-04T00:00:00.000Z"
      }
    });
  });

  it("starts mfa setup and stores the new challenge", async () => {
    postMock.mockResolvedValue({
      data: {
        enabled: true,
        pending: true,
        challenge: "otpauth://totp/test",
        recoveryCodes: []
      }
    });

    const wrapper = shallowMount(MfaSecurityPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    await (wrapper.vm as any).startSetup();

    expect(postMock).toHaveBeenCalledWith("/auth/mfa/configure", {
      action: "setup"
    });
    expect((wrapper.vm as any).setupChallenge).toBe("otpauth://totp/test");
  });

  it("confirms setup with the entered one-time code", async () => {
    postMock.mockResolvedValue({
      data: {
        enabled: true,
        pending: false,
        challenge: null,
        recoveryCodes: ["code-1", "code-2"]
      }
    });

    const wrapper = shallowMount(MfaSecurityPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).setupForm.code = "123456";
    await (wrapper.vm as any).confirmSetup();

    expect(postMock).toHaveBeenCalledWith("/auth/mfa/configure", {
      action: "setup",
      code: "123456",
      recoveryCode: undefined
    });
    expect((wrapper.vm as any).latestRecoveryCodes).toEqual(["code-1", "code-2"]);
  });

  it("uses recovery material for rotate and disable actions", async () => {
    postMock
      .mockResolvedValueOnce({
        data: {
          enabled: true,
          pending: false,
          challenge: null,
          recoveryCodes: ["next-1"]
        }
      })
      .mockResolvedValueOnce({
        data: {
          enabled: false,
          pending: false,
          challenge: null,
          recoveryCodes: []
        }
      });

    const wrapper = shallowMount(MfaSecurityPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).setupForm.recoveryCode = "RECOVERY-1";
    await (wrapper.vm as any).rotateRecoveryCodes();
    (wrapper.vm as any).setupForm.recoveryCode = "RECOVERY-1";
    await (wrapper.vm as any).disableMfa();

    expect(postMock).toHaveBeenNthCalledWith(1, "/auth/mfa/configure", {
      action: "rotate-recovery",
      code: undefined,
      recoveryCode: "RECOVERY-1"
    });
    expect(postMock).toHaveBeenNthCalledWith(2, "/auth/mfa/configure", {
      action: "disable",
      code: undefined,
      recoveryCode: "RECOVERY-1"
    });
  });
});
