import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import AnnouncementsPage from "./AnnouncementsPage.vue";

const openAnnouncementDetail = vi.fn();

vi.mock("@/composables/announcements/useAnnouncementsPage", () => ({
  useAnnouncementsPage: () => ({
    announcements: ref([
      {
        id: "announcement-1",
        title: "五一节假期值班排班发布",
        summary: "请负责人在今天 18:00 前完成确认。",
        publishedAt: "2026-04-05 10:30",
        publishedByName: "行政中心"
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

describe("AnnouncementsPage", () => {
  beforeEach(() => {
    openAnnouncementDetail.mockClear();
  });

  it("opens announcement detail in a drawer context when clicking an item", async () => {
    const wrapper = mount(AnnouncementsPage, {
      global: {
        stubs: {
          AnnouncementDetailDrawer: true,
          "el-empty": true
        }
      }
    });

    expect(wrapper.text()).toContain("公告通知");
    expect(wrapper.text()).toContain("五一节假期值班排班发布");

    await wrapper.get(".announcement-item").trigger("click");

    expect(openAnnouncementDetail).toHaveBeenCalledWith("announcement-1");
  });
});
