import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { ListAdministrativeRequestsDto } from "../src/modules/office-automation/dto/list-administrative-requests.dto";

describe("ListAdministrativeRequestsDto", () => {
  it("treats empty query values as omitted filters", () => {
    const dto = plainToInstance(ListAdministrativeRequestsDto, {
      type: "",
      status: "",
      applicantId: "",
      approverId: "",
      startDate: "",
      endDate: ""
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.type).toBeUndefined();
    expect(dto.status).toBeUndefined();
    expect(dto.applicantId).toBeUndefined();
    expect(dto.approverId).toBeUndefined();
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
  });

  it("still rejects invalid enum values", () => {
    const dto = plainToInstance(ListAdministrativeRequestsDto, {
      type: "INVALID",
      status: "BROKEN"
    });

    const errors = validateSync(dto);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["type", "status"]));
  });
});
