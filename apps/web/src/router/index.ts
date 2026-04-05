import { ElMessage } from "element-plus";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import AppLayout from "../layout/AppLayout.vue";
import AccessControlPage from "../pages/AccessControlPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import CustomersPage from "../pages/CustomersPage.vue";
import LeadsPage from "../pages/LeadsPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import SystemAdminPage from "../pages/SystemAdminPage.vue";
import { useAuthStore } from "../stores/auth";

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
    return true;
  }

  if (!authStore.token) {
    return "/login";
  }

  if (!authStore.currentUser) {
    try {
      await authStore.fetchProfile();
    } catch (error) {
      authStore.logout();
      ElMessage.error("登录状态已失效，请重新登录。");
      return "/login";
    }
  }

  const permission = to.meta.permission;

  if (permission && !authStore.hasPermission(permission)) {
    ElMessage.warning("当前账号没有访问该页面的权限。");
    return "/dashboard";
  }

  return true;
});
