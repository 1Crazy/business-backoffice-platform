/** 路由层：负责页面导航、访问控制和首屏跳转规则。 */
import { ElMessage } from "element-plus";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import { getMicroAppRouterBase } from "@/micro/runtime";
import { resolveFirstAccessiblePath } from "@/router/access";
import { useAuthStore } from "@/stores/auth";
import { redirectToLoginFromGuard } from "@/utils/host-navigation";

// 页面按路由入口懒加载，避免登录页首次进入时把整套后台业务代码一次性打进主包。
const AppLayout = () => import("@/layout/AppLayout.vue");
const AccessControlPage = () => import("@/pages/access-control/AccessControlPage.vue");
const DashboardPage = () => import("@/pages/dashboard/DashboardPage.vue");
const CustomersPage = () => import("@/pages/customers/CustomersPage.vue");
const ForgotPasswordPage = () => import("@/pages/forgot-password/ForgotPasswordPage.vue");
const LeadsPage = () => import("@/pages/leads/LeadsPage.vue");
const LoginPage = () => import("@/pages/login/LoginPage.vue");
const NoAccessPage = () => import("@/pages/no-access/NoAccessPage.vue");
const OpportunitiesPage = () => import("@/pages/opportunities/OpportunitiesPage.vue");
const ResetPasswordPage = () => import("@/pages/reset-password/ResetPasswordPage.vue");
const RevenueOperationsPage = () => import("@/pages/revenue-operations/RevenueOperationsWorkspacePage.vue");
const SystemAdminPage = () => import("@/pages/system-administration/SystemAdminPage.vue");

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
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordPage,
    meta: {
      title: "找回密码",
      hideInMenu: true
    }
  },
  {
    path: "/auth/password-reset",
    name: "reset-password",
    component: ResetPasswordPage,
    meta: {
      title: "重置密码",
      hideInMenu: true
    }
  },
  {
    path: "/no-access",
    name: "no-access",
    component: NoAccessPage,
    meta: {
      title: "权限待配置",
      hideInMenu: true
    }
  },
  {
    path: "/",
    component: AppLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardPage,
        meta: {
          title: "运营看板",
          permission: "dashboard:view"
        }
      },
      {
        path: "departments",
        name: "departments",
        component: AccessControlPage,
        meta: {
          title: "部门管理",
          permission: "department:read"
        }
      },
      {
        path: "customers",
        name: "customers",
        component: CustomersPage,
        meta: {
          title: "客户中心",
          permission: "customer:read"
        }
      },
      {
        path: "opportunities",
        name: "opportunities",
        component: OpportunitiesPage,
        meta: {
          title: "商机管理",
          permission: "opportunity:read"
        }
      },
      {
        path: "revenue-operations",
        name: "revenue-operations",
        component: RevenueOperationsPage,
        meta: {
          title: "经营闭环",
          permission: "opportunity:read"
        }
      },
      {
        path: "leads",
        name: "leads",
        component: LeadsPage,
        meta: {
          title: "线索中心",
          permission: "lead:read"
        }
      },
      {
        path: "system",
        name: "system",
        component: SystemAdminPage,
        meta: {
          title: "系统管理",
          permission: "dictionary:read"
        }
      }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(getMicroAppRouterBase()),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.path === "/login") {
    if (!authStore.sessionExpiresAt) {
      return redirectToLoginFromGuard({ allowStandaloneLogin: true });
    }

    if (!authStore.currentUser) {
      try {
        await authStore.fetchProfile();
      } catch (error) {
        await authStore.logout();
        ElMessage.error("登录状态已失效，请重新登录。");
        return redirectToLoginFromGuard({ allowStandaloneLogin: true });
      }
    }

    return resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []) ?? "/no-access";
  }

  if (!authStore.sessionExpiresAt) {
    return redirectToLoginFromGuard();
  }

  if (!authStore.currentUser) {
    try {
      await authStore.fetchProfile();
    } catch (error) {
      await authStore.logout();
      ElMessage.error("登录状态已失效，请重新登录。");
      return redirectToLoginFromGuard();
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
      ElMessage.warning("当前账号没有访问该页面的权限，已为你跳转到可访问页面。");
      return fallbackPath;
    }

    ElMessage.warning("当前账号没有可访问的页面，请联系管理员分配权限。");
    return "/no-access";
  }

  return true;
});
