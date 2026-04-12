import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdministrativeRequestCollectionPage } from "./useAdministrativeRequestCollectionPage";

const apiMocks = vi.hoisted(() => ({
  cancelAdministrativeRequest: vi.fn(),
  decideAdministrativeRequest: vi.fn(),
  fetchMyAdministrativeRequests: vi.fn(),
  fetchPendingAdministrativeApprovals: vi.fn()
}));

vi.mock("@/api/approvals.api", () => ({
  cancelAdministrativeRequest: apiMocks.cancelAdministrativeRequest,
  decideAdministrativeRequest: apiMocks.decideAdministrativeRequest,
  fetchMyAdministrativeRequests: apiMocks.fetchMyAdministrativeRequests,
  fetchPendingAdministrativeApprovals: apiMocks.fetchPendingAdministrativeApprovals
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

async function flushUi(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

describe("useAdministrativeRequestCollectionPage", () => {
  beforeEach(() => {
    apiMocks.cancelAdministrativeRequest.mockReset();
    apiMocks.decideAdministrativeRequest.mockReset();
    apiMocks.fetchMyAdministrativeRequests.mockReset();
    apiMocks.fetchPendingAdministrativeApprovals.mockReset();
    apiMocks.fetchPendingAdministrativeApprovals.mockResolvedValue([]);
  });

  it("auto reloads pending approvals when filters change and omits empty filters", async () => {
    let collectionPage!: ReturnType<typeof useAdministrativeRequestCollectionPage>;

    const TestHarness = defineComponent({
      setup() {
        collectionPage = useAdministrativeRequestCollectionPage("pending");
        return collectionPage;
      },
      template: "<div />"
    });

    const wrapper = mount(TestHarness);
    await flushUi();

    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenCalledTimes(1);
    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenLastCalledWith({
      type: undefined,
      status: undefined
    });

    collectionPage.filters.type = "REIMBURSEMENT";
    await flushUi();

    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenCalledTimes(2);
    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenLastCalledWith({
      type: "REIMBURSEMENT",
      status: undefined
    });

    collectionPage.filters.status = "PENDING";
    await flushUi();

    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenCalledTimes(3);
    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenLastCalledWith({
      type: "REIMBURSEMENT",
      status: "PENDING"
    });

    collectionPage.filters.type = "";
    await flushUi();

    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenCalledTimes(4);
    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenLastCalledWith({
      type: undefined,
      status: "PENDING"
    });

    wrapper.unmount();
  });

  it("resets filters with a single reload", async () => {
    let collectionPage!: ReturnType<typeof useAdministrativeRequestCollectionPage>;

    const TestHarness = defineComponent({
      setup() {
        collectionPage = useAdministrativeRequestCollectionPage("pending");
        return collectionPage;
      },
      template: "<div />"
    });

    const wrapper = mount(TestHarness);
    await flushUi();

    collectionPage.filters.type = "TRAVEL";
    collectionPage.filters.status = "PENDING";
    await flushUi();
    apiMocks.fetchPendingAdministrativeApprovals.mockClear();

    collectionPage.resetFilters();
    await flushUi();

    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenCalledTimes(1);
    expect(apiMocks.fetchPendingAdministrativeApprovals).toHaveBeenLastCalledWith({
      type: undefined,
      status: undefined
    });

    wrapper.unmount();
  });
});
