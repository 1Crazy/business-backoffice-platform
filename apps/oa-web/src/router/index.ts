/** 路由层：负责页面导航、访问控制和 OA 首屏跳转规则。 */
import { ElMessage } from "element-plus";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import { resolveFirstAccessiblePath } from "@/router/access";
import { useAuthStore } from "@/stores/auth";

const AppLayout = () => import("@/layout/AppLayout.vue");
const LoginPage = () => import("@/pages/login/LoginPage.vue");
const NoAccessPage = () => import("@/pages/no-access/NoAccessPage.vue");
const WorkspacePage = () => import("@/pages/workspace/WorkspacePage.vue");
const ApprovalsInboxPage = () => import("@/pages/approvals/ApprovalsInboxPage.vue");
const MyRequestsPage = () => import("@/pages/approvals/MyRequestsPage.vue");
const LeaveRequestPage = () => import("@/pages/leave/LeaveRequestPage.vue");
const AnnouncementsPage = () => import("@/pages/announcements/AnnouncementsPage.vue");
const AnnouncementDetailPage = () => import("@/pages/announcements/AnnouncementDetailPage.vue");
const DirectoryPage = () => import("@/pages/directory/DirectoryPage.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      title: "登录"
    }
  },
  {
    path: "/no-access",
    name: "no-access",
    component: NoAccessPage,
    meta: {
      title: "权限待配置",
      hidden: true
    }
  },
  {
    path: "/",
    component: AppLayout,
    redirect: "/workspace",
    children: [
      {
        path: "workspace",
        name: "workspace",
        component: WorkspacePage,
        meta: {
          title: "工作台",
          permission: "oa:workspace:view"
        }
      },
      {
        path: "approvals/pending",
        name: "approvals-pending",
        component: ApprovalsInboxPage,
        meta: {
          title: "待我审批",
          permission: "oa:approval:read"
        }
      },
      {
        path: "approvals/mine",
        name: "approvals-mine",
        component: MyRequestsPage,
        meta: {
          title: "我发起的申请",
          permission: "oa:leave:apply"
        }
      },
      {
        path: "leave/request",
        name: "leave-request",
        component: LeaveRequestPage,
        meta: {
          title: "请假申请",
          permission: "oa:leave:apply"
        }
      },
      {
        path: "announcements",
        name: "announcements",
        component: AnnouncementsPage,
        meta: {
          title: "公告通知",
          permission: "oa:announcement:read"
        }
      },
      {
        path: "announcements/:id",
        name: "announcement-detail",
        component: AnnouncementDetailPage,
        meta: {
          title: "公告详情",
          permission: "oa:announcement:read",
          hidden: true
        }
      },
      {
        path: "directory",
        name: "directory",
        component: DirectoryPage,
        meta: {
          title: "组织通讯录",
          permission: "oa:directory:read"
        }
      }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.path === "/login") {
    if (!authStore.token) {
      return true;
    }

    if (!authStore.currentUser) {
      try {
        await authStore.fetchProfile();
      } catch {
        await authStore.logout();
        ElMessage.error("登录状态已失效，请重新登录。");
        return true;
      }
    }

    return resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []) ?? "/no-access";
  }

  if (!authStore.token) {
    return "/login";
  }

  if (!authStore.currentUser) {
    try {
      await authStore.fetchProfile();
    } catch {
      await authStore.logout();
      ElMessage.error("登录状态已失效，请重新登录。");
      return "/login";
    }
  }

  if (to.path === "/no-access") {
    const fallbackPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);

    if (fallbackPath) {
      return fallbackPath;
    }

    return true;
  }

  const permission = to.meta.permission;

  if (permission && !authStore.hasPermission(permission)) {
    const fallbackPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);

    if (fallbackPath && fallbackPath !== to.path) {
      ElMessage.warning("当前账号没有访问该页面的权限，已为你跳转到可访问的 OA 页面。");
      return fallbackPath;
    }

    ElMessage.warning("当前账号暂未开通 OA 页面权限，请联系管理员配置。");
    return "/no-access";
  }

  return true;
});
