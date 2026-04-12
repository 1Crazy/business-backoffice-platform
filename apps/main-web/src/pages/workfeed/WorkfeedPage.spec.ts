// @vitest-environment jsdom

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import WorkfeedPage from "./WorkfeedPage.vue";

const pushMock = vi.fn();

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

vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn()
  }
}));

describe("WorkfeedPage", () => {
  it("opens a drawer first and then navigates when confirming a todo item", async () => {
    const wrapper = mount(WorkfeedPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-select": true,
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

    await card.trigger("click");

    expect(wrapper.text()).toContain("事项摘要");

    const actionButton = wrapper
      .findAll("button")
      .find((item) => item.text().includes("进入处理"));

    expect(actionButton).toBeTruthy();

    await actionButton!.trigger("click");

    expect(pushMock).toHaveBeenCalledWith("/oa/approvals/123");
  });
});
