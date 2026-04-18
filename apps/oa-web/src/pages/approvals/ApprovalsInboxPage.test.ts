import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";

import ApprovalsInboxPage from "./ApprovalsInboxPage.vue";

const openDecisionDialogMock = vi.fn();
const closeDecisionDialogMock = vi.fn();
const submitDecisionMock = vi.fn();

const approvals = ref([
  {
    id: "approval-1",
    requestCategory: "LEAVE",
    requestType: "ANNUAL",
    requestNo: null,
    applicantName: "王小明",
    title: "年假申请",
    summary: "2026-04-12 09:00 至 2026-04-12 18:00",
    status: "PENDING",
    submittedAt: "2026-04-11 09:00"
  }
]);

const processingId = ref<string | null>(null);
const decisionDialogVisible = ref(true);
const currentApproval = ref(approvals.value[0]);
const pendingDecision = ref<"APPROVED" | "REJECTED">("REJECTED");
const decisionComment = ref("");
const decisionSubmitting = computed(() => processingId.value === currentApproval.value?.id);

vi.mock("@/composables/approvals/useApprovalsInboxPage", () => ({
  useApprovalsInboxPage: () => ({
    approvals,
    closeDecisionDialog: closeDecisionDialogMock,
    currentApproval,
    decisionComment,
    decisionDialogVisible,
    decisionSubmitting,
    openDecisionDialog: openDecisionDialogMock,
    pendingDecision,
    processingId,
    submitDecision: submitDecisionMock
  })
}));

describe("ApprovalsInboxPage", () => {
  it("opens the review dialog from table actions and renders dialog copy", async () => {
    const wrapper = mount(ApprovalsInboxPage, {
      global: {
        stubs: {
          "el-table": {
            template: "<div><slot /></div>"
          },
          "el-table-column": {
            props: ["label", "prop"],
            template: `
              <div>
                <slot
                  :row="{
                    id: 'approval-1',
                    requestCategory: 'LEAVE',
                    requestType: 'ANNUAL',
                    requestNo: null,
                    applicantName: '王小明',
                    title: '年假申请',
                    summary: '2026-04-12 09:00 至 2026-04-12 18:00',
                    status: 'PENDING',
                    submittedAt: '2026-04-11 09:00'
                  }"
                />
              </div>
            `
          },
          "el-button": {
            emits: ["click"],
            template: "<button @click=\"$emit('click')\"><slot /></button>"
          },
          "el-dialog": {
            props: ["modelValue", "title"],
            emits: ["update:modelValue", "closed"],
            template: `
              <div v-if="modelValue">
                <h3>{{ title }}</h3>
                <slot />
                <slot name="footer" />
              </div>
            `
          },
          "el-form": {
            template: "<form><slot /></form>"
          },
          "el-form-item": {
            props: ["label"],
            template: "<label>{{ label }}<slot /></label>"
          },
          "el-input": {
            props: ["modelValue"],
            emits: ["update:modelValue"],
            template: "<textarea :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value)\" />"
          },
          "el-alert": {
            props: ["title", "description"],
            template: "<div><strong>{{ title }}</strong><span>{{ description }}</span></div>"
          },
          "el-empty": true
        }
      }
    });

    const approveButton = wrapper
      .findAll("button")
      .find((item) => item.text() === "通过");

    expect(approveButton).toBeTruthy();

    await approveButton!.trigger("click");

    expect(openDecisionDialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "approval-1",
        applicantName: "王小明"
      }),
      "APPROVED"
    );
    expect(wrapper.text()).toContain("驳回流程");
    expect(wrapper.text()).toContain("驳回后将立即更新流程状态");
    expect(wrapper.text()).toContain("请假申请");
    expect(wrapper.text()).toContain("2026-04-12 09:00 至 2026-04-12 18:00");
    expect(wrapper.text()).toContain("确认驳回");
  });
});
