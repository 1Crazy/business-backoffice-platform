// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import LayoutSidebarNav from "./LayoutSidebarNav.vue";

describe("LayoutSidebarNav", () => {
  it("renders group titles without legacy domain badges", async () => {
    const wrapper = mount(LayoutSidebarNav, {
      props: {
        activeDomain: "oa",
        activePath: "/oa/workspace",
        groups: [
          {
            key: "oa",
            title: "协同事务",
            caption: "审批、请假、公告与组织联络",
            items: [
              {
                key: "oa-workspace",
                title: "工作台",
                description: "查看今天的重点待办、公告摘要与快捷办公入口。",
                path: "/oa/workspace",
                domain: "oa",
                domainTitle: "OA 办公",
                domainBadge: "OA",
                sectionLabel: "今日工作",
                kicker: "办公协同",
                microAppName: "oa-web",
                icon: "compass"
              }
            ]
          }
        ]
      },
      global: {
        stubs: {
          "el-menu": {
            props: ["defaultActive"],
            template: "<div class='menu-stub'><slot /></div>"
          },
          "el-sub-menu": {
            props: ["index"],
            template: "<div class='submenu-stub'><slot name='title' /><slot /></div>"
          },
          "el-menu-item": {
            props: ["index"],
            template: "<div class='menu-item-stub'><slot /></div>"
          }
        }
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find(".host-submenu-title").text()).toBe("协同事务");
    expect(wrapper.find(".host-submenu-badge").exists()).toBe(false);
  });
});
