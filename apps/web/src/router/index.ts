/** 路由层：负责页面导航、访问控制和首屏跳转规则。 */
import { ElMessage } from "element-plus";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import AppLayout from "@/layout/AppLayout.vue";
import AccessControlPage from "@/pages/access-control/AccessControlPage.vue";
import DashboardPage from "@/pages/dashboard/DashboardPage.vue";
import CustomersPage from "@/pages/customers/CustomersPage.vue";
import LeadsPage from "@/pages/leads/LeadsPage.vue";
import LoginPage from "@/pages/login/LoginPage.vue";
import NoAccessPage from "@/pages/no-access/NoAccessPage.vue";
import SystemAdminPage from "@/pages/system-administration/SystemAdminPage.vue";
import { resolveFirstAccessiblePath } from "@/router/access";
import { useAuthStore } from "@/stores/auth";

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
      } catch (error) {
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
    } catch (error) {
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
      ElMessage.warning("当前账号没有访问该页面的权限，已为你跳转到可访问页面。");
      return fallbackPath;
    }

    ElMessage.warning("当前账号没有可访问的页面，请联系管理员分配权限。");
    return "/no-access";
  }

  return true;
});
