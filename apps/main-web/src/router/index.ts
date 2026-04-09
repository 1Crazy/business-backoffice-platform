/** 路由层：负责主应用登录守卫、权限兜底与子应用页面路由映射。 */
import { ElMessage } from "element-plus";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import { allNavigationItems, resolveFirstAccessiblePath } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth";

const AppLayout = () => import("@/layout/AppLayout.vue");
const LoginPage = () => import("@/pages/login/LoginPage.vue");
const MicroAppPage = () => import("@/pages/micro-app/MicroAppPage.vue");
const NoAccessPage = () => import("@/pages/no-access/NoAccessPage.vue");

const microRoutes: RouteRecordRaw[] = allNavigationItems.map((item) => ({
  path: item.path.slice(1),
  name: item.key,
  component: MicroAppPage,
  meta: {
    title: item.title,
    description: item.description,
    permission: item.permission,
    hidden: item.hidden,
    sectionLabel: item.sectionLabel,
    kicker: item.kicker,
    domain: item.domain,
    domainTitle: item.domainTitle,
    domainBadge: item.domainBadge,
    microAppName: item.microAppName
  }
}));

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
    children: microRoutes
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/no-access",
    meta: {
      hidden: true
    }
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

  if (to.path === "/") {
    return resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []) ?? "/no-access";
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
      ElMessage.warning("当前账号没有访问该页面的权限，已为你跳转到可访问的主应用页面。");
      return fallbackPath;
    }

    ElMessage.warning("当前账号暂未开通可访问页面，请联系管理员配置。");
    return "/no-access";
  }

  return true;
});
