import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mount, RouterLinkStub } from "@vue/test-utils";

import WorkspacePage from "./WorkspacePage.vue";

const openAnnouncementDetail = vi.fn();

vi.mock("@/composables/workspace/useWorkspacePage", () => ({
  useWorkspacePage: () => ({
    isLoading: ref(false),
    overview: ref({
      pendingApprovalCount: 12,
      myRequestCount: 4,
      administrativeRequestPendingCount: 3,
      administrativeRequestMyCount: 2,
      activeAnnouncementCount: 7,
      directoryDepartmentCount: 18,
      recentAnnouncements: [
        {
          id: "announcement-1",
          title: "五一节假期值班排班发布",
          summary: "请负责人在今天 18:00 前完成确认。",
          publishedAt: "2026-04-05 10:30",
          publishedByName: "行政中心"
        }
      ]
    }),
    templateCards: ref([
      {
        key: "LEAVE",
        label: "请假申请",
        shortLabel: "请假",
        caption: "假勤",
        createRoute: "/leave/request",
        listRoute: "/approvals/mine"
      },
      {
        key: "SEAL",
        label: "用印申请",
        shortLabel: "用印",
        caption: "法务",
        createRoute: "/administrative-requests/new?type=SEAL",
        listRoute: "/approvals/mine"
      }
    ])
  })
}));

vi.mock("@/composables/announcements/useAnnouncementDetailDrawer", () => ({
  useAnnouncementDetailDrawer: () => ({
    announcement: ref(null),
    drawerVisible: ref(false),
    isLoading: ref(false),
    isTabletOrDown: ref(false),
    openAnnouncementDetail
  })
}));

describe("WorkspacePage", () => {
  it("renders the upgraded workspace hero, metrics, and announcement list", async () => {
    openAnnouncementDetail.mockClear();

    const wrapper = mount(WorkspacePage, {
      global: {
        stubs: {
          AnnouncementDetailDrawer: true,
          RouterLink: RouterLinkStub,
          "el-empty": true
        }
      }
    });

    expect(wrapper.text()).toContain("按模板发起");
    expect(wrapper.text()).toContain("待我审批");
    expect(wrapper.text()).toContain("统一待办入口");
    expect(wrapper.text()).toContain("12");
    expect(wrapper.text()).toContain("请假申请");
    expect(wrapper.text()).toContain("用印申请");
    expect(wrapper.text()).toContain("最近公告");
    expect(wrapper.text()).toContain("五一节假期值班排班发布");

    await wrapper.get(".announcement-item").trigger("click");

    expect(openAnnouncementDetail).toHaveBeenCalledWith("announcement-1");
  });
});
