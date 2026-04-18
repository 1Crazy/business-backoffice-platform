// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkfeedPage from "./WorkfeedPage.vue";

const { pushMock, fetchPreferencesMock, updatePreferencesMock, messageErrorMock, messageInfoMock, messageSuccessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  fetchPreferencesMock: vi.fn(),
  updatePreferencesMock: vi.fn(),
  messageErrorMock: vi.fn(),
  messageInfoMock: vi.fn(),
  messageSuccessMock: vi.fn()
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock("@/api/workfeed.api", () => ({
  fetchWorkfeedTodos: vi.fn().mockResolvedValue([
    {
      id: "todo-1",
      domain: "oa",
      type: "LEAVE_APPROVAL",
      title: "请假审批",
      summary: "待处理请假审批",
      priority: "HIGH",
      dueAt: "2026-04-12T00:00:00Z",
      status: "PENDING",
      targetPath: "/oa/approvals/123",
      targetLabel: "请假审批详情",
      sourceId: "todo-1",
      createdAt: "2026-04-11T00:00:00Z"
    }
  ]),
  fetchWorkfeedNotifications: vi.fn().mockResolvedValue([]),
  markWorkfeedNotificationRead: vi.fn()
}));

vi.mock("@/api/notification-center.api", () => ({
  fetchNotificationPreferences: fetchPreferencesMock,
  updateNotificationPreferences: updatePreferencesMock
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    error: messageErrorMock,
    info: messageInfoMock,
    success: messageSuccessMock
  }
}));

describe("WorkfeedPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    fetchPreferencesMock.mockReset();
    updatePreferencesMock.mockClear();
    messageErrorMock.mockClear();
    messageInfoMock.mockClear();
    messageSuccessMock.mockClear();

    fetchPreferencesMock.mockResolvedValue([
      {
        id: "pref-workflow-result",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 480,
        quietHours: null,
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z"
      }
    ]);
    updatePreferencesMock.mockResolvedValue([
      {
        id: "pref-workflow-result",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: true,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 480,
        quietHours: null,
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z"
      }
    ]);
  });

  it("opens a drawer first and then navigates when confirming a todo item", async () => {
    const wrapper = mount(WorkfeedPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-select": {
            props: ["modelValue"],
            emits: ["update:modelValue"],
            template: "<div><slot /></div>"
          },
          "el-option": true,
          "el-button": {
            emits: ["click"],
            template: "<button @click=\"$emit('click')\"><slot /></button>"
          },
          "el-switch": true,
          "el-tag": true,
          "el-empty": true,
          "el-drawer": {
            props: ["modelValue", "title"],
            emits: ["update:modelValue"],
            template: "<div class='drawer-stub' v-if='modelValue'><slot /></div>"
          }
        }
      }
    });

    await flushPromises();

    const card = wrapper.find(".feed-entry-card");

    expect(card.exists()).toBe(true);
    expect(wrapper.text()).toContain("消息中心");

    await card.trigger("click");

    expect(wrapper.text()).toContain("事项摘要");

    const actionButton = wrapper
      .findAll("button")
      .find((item) => item.text().includes("进入处理"));

    expect(actionButton).toBeTruthy();

    await actionButton!.trigger("click");

    expect(pushMock).toHaveBeenCalledWith("/oa/approvals/123");
  });

  it("shows a clear message when clicking the locked in-app channel", async () => {
    const wrapper = mount(WorkfeedPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-select": {
            props: ["modelValue"],
            emits: ["update:modelValue"],
            template: "<div><slot /></div>"
          },
          "el-option": true,
          "el-button": {
            emits: ["click"],
            template: "<button @click=\"$emit('click')\"><slot /></button>"
          },
          "el-switch": true,
          "el-tag": true,
          "el-empty": true,
          "el-drawer": {
            props: ["modelValue", "title"],
            emits: ["update:modelValue"],
            template: "<div class='drawer-stub' v-if='modelValue'><slot /></div>"
          }
        }
      }
    });

    await flushPromises();

    const inAppButton = wrapper
      .findAll("button")
      .find((item) => item.text().includes("站内消息"));

    expect(inAppButton).toBeTruthy();

    await inAppButton!.trigger("click");

    expect(messageInfoMock).toHaveBeenCalledWith("站内消息是基础通知渠道，当前版本固定开启。");
  });

  it("persists preference changes when clicking an editable channel", async () => {
    const wrapper = mount(WorkfeedPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-select": {
            props: ["modelValue"],
            emits: ["update:modelValue"],
            template: "<div><slot /></div>"
          },
          "el-option": true,
          "el-button": {
            emits: ["click"],
            template: "<button @click=\"$emit('click')\"><slot /></button>"
          },
          "el-switch": true,
          "el-tag": true,
          "el-empty": true,
          "el-drawer": {
            props: ["modelValue", "title"],
            emits: ["update:modelValue"],
            template: "<div class='drawer-stub' v-if='modelValue'><slot /></div>"
          }
        }
      }
    });

    await flushPromises();

    const emailButton = wrapper
      .findAll("button")
      .find((item) => item.text().includes("邮件"));

    expect(emailButton).toBeTruthy();

    await emailButton!.trigger("click");
    await flushPromises();

    expect(updatePreferencesMock).toHaveBeenCalledWith({
      preferences: [
        {
          domain: "OA",
          eventType: "WORKFLOW_RESULT",
          subscribed: true,
          emailEnabled: true,
          enterpriseImEnabled: false,
          digestMode: "IMMEDIATE",
          reminderFrequencyMinutes: null,
          nudgeThresholdMinutes: 480,
          quietHours: null
        }
      ]
    });
    expect(messageSuccessMock).toHaveBeenCalledWith("通知偏好已更新。");
  });

  it("toggles linked subscription cards together when they share one backend preference", async () => {
    fetchPreferencesMock.mockResolvedValueOnce([
      {
        id: "pref-workflow-result",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        subscribed: false,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 480,
        quietHours: null,
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z"
      }
    ]);
    updatePreferencesMock.mockResolvedValueOnce([
      {
        id: "pref-workflow-result",
        domain: "OA",
        eventType: "WORKFLOW_RESULT",
        subscribed: true,
        inAppEnabled: true,
        emailEnabled: false,
        enterpriseImEnabled: false,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: null,
        nudgeThresholdMinutes: 480,
        quietHours: null,
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z"
      }
    ]);

    const wrapper = mount(WorkfeedPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-select": {
            props: ["modelValue"],
            emits: ["update:modelValue"],
            template: "<div><slot /></div>"
          },
          "el-option": true,
          "el-button": {
            emits: ["click"],
            template: "<button @click=\"$emit('click')\"><slot /></button>"
          },
          "el-switch": true,
          "el-tag": true,
          "el-empty": true,
          "el-drawer": {
            props: ["modelValue", "title"],
            emits: ["update:modelValue"],
            template: "<div class='drawer-stub' v-if='modelValue'><slot /></div>"
          }
        }
      }
    });

    await flushPromises();

    const approvalResultButton = wrapper
      .findAll("button")
      .find((item) => item.text().includes("审批结果"));

    expect(approvalResultButton).toBeTruthy();
    expect(wrapper.text()).toContain("覆盖请假结果与行政结果。");

    await approvalResultButton!.trigger("click");
    await flushPromises();

    expect(updatePreferencesMock).toHaveBeenCalledWith({
      preferences: [
        {
          domain: "OA",
          eventType: "WORKFLOW_RESULT",
          subscribed: true,
          emailEnabled: false,
          enterpriseImEnabled: false,
          digestMode: "IMMEDIATE",
          reminderFrequencyMinutes: null,
          nudgeThresholdMinutes: 480,
          quietHours: null
        }
      ]
    });
  });
});
