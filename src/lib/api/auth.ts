import { getWithAuth, postForm, type ApiResult } from "./client";
import type { MediaItem, MediaModule, MediaPurpose } from "@/types/media";
import type { ClassPayload } from "@/types/classes";
import type { EmployeeEnrollment } from "@/types/erp";
import type { Permissions } from "@/lib/permissions";

// The editable fields of a class, minus `id` — updateClass needs `id` to mean the
// *current* name and passes the new one as `newId`. Form bodies are flat, so aliases
// travel as a comma-separated string.
function classBody(c: ClassPayload): Record<string, string> {
  return {
    center: c.center,
    level: c.level ?? "",
    order: c.order === undefined ? "" : String(c.order),
    inchargeName: c.inchargeName,
    inchargeEmail: c.inchargeEmail ?? "",
    inchargeAliases: (c.inchargeAliases ?? []).join(", "),
  };
}

// Direct 1:1 port of connect_server.dart (AuthService). Same endpoints, same body
// keys, same Bearer-token auth, same `JSON.stringify(data)` for the `data` field,
// same `'e'` sentinel on error. The backend is reused unchanged.
export const AuthService = {
  // ---- Auth / account ------------------------------------------------------
  login(email: string, password: string): Promise<ApiResult> {
    return postForm("/signinvonisha", { email, password });
  },

  addVonishaUser(
    email: string,
    f: string,
    l: string,
    type: string,
    data: unknown,
    number: string,
    token: string,
  ): Promise<ApiResult> {
    return postForm(
      "/addvonishauser",
      { email, firstName: f, lastName: l, type, data: JSON.stringify(data), number },
      token,
    );
  },

  addVonishaStudent(cl: string, data: unknown, token: string): Promise<ApiResult> {
    return postForm("/addvonishastudent", { class: cl, data: JSON.stringify(data) }, token);
  },

  resetPassword(p: string, token: string): Promise<ApiResult> {
    return postForm("/resetvonishapassword", { p }, token);
  },

  validateToken(token: string): Promise<ApiResult> {
    return getWithAuth("/validatevonishatoken", token);
  },

  getInfo(token: string): Promise<ApiResult> {
    return getWithAuth("/getinfo", token);
  },

  changeName(firstName: string, lastName: string, token: string): Promise<ApiResult> {
    return postForm("/changename", { firstName, lastName, token }, token);
  },

  requestPasswordReset(email: string): Promise<ApiResult> {
    return postForm("/requestPasswordReset", { email });
  },

  compareTokenPass(token: string): Promise<ApiResult> {
    return postForm("/comparetokenpass", {}, token);
  },

  // ---- Accounts, roles & access (RBAC) --------------------------------------
  getRoles(token: string): Promise<ApiResult> {
    return getWithAuth("/getRoles", token);
  },

  saveRole(
    token: string,
    role: { key?: string; name: string; description: string; permissions: Permissions },
  ): Promise<ApiResult> {
    return postForm(
      "/saveRole",
      {
        key: role.key ?? "",
        name: role.name,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
      },
      token,
    );
  },

  deleteRole(token: string, key: string): Promise<ApiResult> {
    return postForm("/deleteRole", { key }, token);
  },

  getAccounts(token: string): Promise<ApiResult> {
    return getWithAuth("/getAccounts", token);
  },

  createAccount(
    token: string,
    a: { email: string; firstName: string; lastName: string; number: string; roleKey: string },
  ): Promise<ApiResult> {
    return postForm("/createAccount", a, token);
  },

  resendInvite(token: string, email: string): Promise<ApiResult> {
    return postForm("/resendInvite", { email }, token);
  },

  assignRole(token: string, email: string, roleKey: string): Promise<ApiResult> {
    return postForm("/assignRole", { email, roleKey }, token);
  },

  updateAccount(
    token: string,
    a: { email: string; firstName?: string; lastName?: string; number?: string; disabled?: boolean },
  ): Promise<ApiResult> {
    return postForm(
      "/updateAccount",
      { ...a, disabled: a.disabled === undefined ? undefined : String(a.disabled) },
      token,
    );
  },

  // ---- Venues / bookings ---------------------------------------------------
  addVenue(token: string, name: string, capacity: string, type: string): Promise<ApiResult> {
    return postForm("/addvenue", { name, capacity, type }, token);
  },

  addBooking(token: string, data: unknown): Promise<ApiResult> {
    return postForm("/addbooking", { data: JSON.stringify(data) }, token);
  },

  getBookings(token: string, dates: string): Promise<ApiResult> {
    return postForm("/getbookings", { dates }, token);
  },

  getVenueNames(token: string): Promise<ApiResult> {
    return getWithAuth("/getvenuenames", token);
  },

  // Note the `Bearer <token> <id>` quirk from the Flutter client.
  getBookingDetails(token: string, id: string): Promise<ApiResult> {
    return getWithAuth("/getbookingdetails", token, id);
  },

  deleteBooking(token: string, id: string): Promise<ApiResult> {
    return getWithAuth("/deletebooking", token, id);
  },

  // ---- Users / students ----------------------------------------------------
  getUserDetails(token: string): Promise<ApiResult> {
    return getWithAuth("/getvonishauserdetails", token);
  },

  getStudentDetails(token: string, cl: string): Promise<ApiResult> {
    return postForm("/getvonishastudents", { class: cl }, token);
  },

  updateVonishaStudent(
    token: string,
    data: unknown,
    classSec: string,
    index: number | string,
  ): Promise<ApiResult> {
    return postForm(
      "/updatevonishastudent",
      { index, class: classSec, data: JSON.stringify(data) },
      token,
    );
  },

  updateVonishaStaff(
    token: string,
    data: unknown,
    email: string,
    firstName: string,
    lastName: string,
    number: string,
  ): Promise<ApiResult> {
    return postForm(
      "/updatevonishastaff",
      { number, email, firstName, lastName, data: JSON.stringify(data) },
      token,
    );
  },

  // ---- Attendance ----------------------------------------------------------
  getStaffAttendance(token: string): Promise<ApiResult> {
    return getWithAuth("/getstaffattendance", token);
  },

  getStaffAttendanceDetails(token: string, email: string): Promise<ApiResult> {
    return postForm("/getstaffattendance", { email }, token);
  },

  updateStaffAttendance(token: string, data: unknown): Promise<ApiResult> {
    return postForm("/updatestaffattendance", { data: JSON.stringify(data) }, token);
  },

  updateStudentAttendance(token: string, data: unknown, clas: string): Promise<ApiResult> {
    return postForm(
      "/updatevonishastudentattendance",
      { data: JSON.stringify(data), clas },
      token,
    );
  },

  getStuAttendance(token: string, data: string): Promise<ApiResult> {
    return postForm("/getstudentattendance", { class: data }, token);
  },

  // ---- Student attendance (per class, per day) -----------------------------
  // Access is decided server-side by canMarkAttendance: admins and coordinators get
  // every class, faculty only the classes they are the person-in-charge of.
  //
  // The paths say "ClassAttendance" because Express matches case-insensitively, so
  // "/getStudentAttendance" would hit the legacy "/getstudentattendance" handler.

  /** Roster + whatever is already recorded for `date` (ISO yyyy-mm-dd). */
  getStudentAttendance(token: string, cl: string, date: string): Promise<ApiResult> {
    return postForm("/getClassAttendance", { class: cl, date }, token);
  },

  /** Replaces the whole class-day. `data` is [{ index, status }]. */
  saveStudentAttendance(
    token: string,
    cl: string,
    date: string,
    data: { index: number; status: string }[],
  ): Promise<ApiResult> {
    return postForm(
      "/saveClassAttendance",
      { class: cl, date, data: JSON.stringify(data) },
      token,
    );
  },

  /** Per-day totals for every marked day in [from, to] (both ISO yyyy-mm-dd). */
  getStudentAttendanceRange(
    token: string,
    cl: string,
    from: string,
    to: string,
  ): Promise<ApiResult> {
    return postForm("/getClassAttendanceRange", { class: cl, from, to }, token);
  },

  // ---- Enquiries -----------------------------------------------------------
  addEnquiry(
    token: string,
    name: string,
    number: string,
    date: string,
    remarks: string,
  ): Promise<ApiResult> {
    return postForm("/addvonishaenquiry", { name, number, date, remarks }, token);
  },

  getEnquiries(token: string): Promise<ApiResult> {
    return getWithAuth("/getvonishaenquiry", token);
  },

  // ---- Calendar ------------------------------------------------------------
  updateCalender(token: string, data: unknown, month: string): Promise<ApiResult> {
    return postForm("/updatevonishaCalender", { month, data: JSON.stringify(data) }, token);
  },

  getCalender(token: string): Promise<ApiResult> {
    return getWithAuth("/getvonishacalender", token);
  },

  // ---- Fixed assets --------------------------------------------------------
  addFixedAssetCenter(token: string, center: string, data: unknown): Promise<ApiResult> {
    // Flutter sends `data` without JSON.stringify here — preserved verbatim.
    return postForm("/addCenterFixedAssets", { center, data: data as string }, token);
  },

  getFixedAssetDetails(token: string): Promise<ApiResult> {
    return getWithAuth("/getFixedAssets", token);
  },

  // ---- Media (invoices, evidence, documents) — private S3 presigned URLs ----
  // Ask the server for a short-lived presigned PUT URL. The browser then uploads
  // the file straight to the private bucket (see lib/s3-upload.ts).
  getUploadUrl(
    token: string,
    payload: {
      purpose: MediaPurpose;
      module: MediaModule;
      contentType: string;
      ext: string;
      size: number;
      originalName?: string;
    },
  ): Promise<ApiResult> {
    return postForm(
      "/getUploadUrl",
      {
        purpose: payload.purpose,
        module: payload.module,
        contentType: payload.contentType,
        ext: payload.ext,
        size: String(payload.size),
        originalName: payload.originalName ?? "",
      },
      token,
    );
  },

  // Resolve stored object keys into short-lived presigned GET URLs. Pass
  // `download` for URLs that save the file rather than rendering it inline.
  getMediaUrls(token: string, keys: string[], download = false): Promise<ApiResult> {
    return postForm(
      "/getMediaUrls",
      { keys: JSON.stringify(keys), download: String(download) },
      token,
    );
  },

  // ---- Admin file storage — every module's files in one index (admin only) --
  getFileStorage(token: string): Promise<ApiResult> {
    return getWithAuth("/getFileStorage", token);
  },

  /** Detach a file from its record and delete it from S3 once unreferenced. */
  deleteStoredFile(token: string, key: string): Promise<ApiResult> {
    return postForm("/deleteStoredFile", { key }, token);
  },

  // ---- Asset stock management ----------------------------------------------
  getAssetStock(token: string, center?: string): Promise<ApiResult> {
    const qs = center ? `?center=${encodeURIComponent(center)}` : "";
    return getWithAuth(`/getAssetStock${qs}`, token);
  },

  getAssetCenters(token: string): Promise<ApiResult> {
    return getWithAuth("/getAssetCenters", token);
  },

  getAssetLog(token: string): Promise<ApiResult> {
    return getWithAuth("/getAssetLog", token);
  },

  createAssetRequest(
    token: string,
    payload: {
      action: string;
      center: string;
      toCenter?: string;
      assetName: string;
      quantity: number;
      note?: string;
      media?: MediaItem[];
    },
  ): Promise<ApiResult> {
    return postForm(
      "/createAssetRequest",
      {
        action: payload.action,
        center: payload.center,
        toCenter: payload.toCenter ?? "",
        assetName: payload.assetName,
        quantity: String(payload.quantity),
        note: payload.note ?? "",
        media: JSON.stringify(payload.media ?? []),
      },
      token,
    );
  },

  getAssetRequests(
    token: string,
    opts?: { status?: string; mine?: boolean },
  ): Promise<ApiResult> {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.mine) params.set("mine", "1");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return getWithAuth(`/getAssetRequests${qs}`, token);
  },

  resolveAssetRequest(
    token: string,
    id: string,
    decision: "approve" | "reject",
    rejectReason?: string,
  ): Promise<ApiResult> {
    return postForm(
      "/resolveAssetRequest",
      { id, decision, rejectReason: rejectReason ?? "" },
      token,
    );
  },

  applyAssetRequest(token: string, id: string, media?: MediaItem[]): Promise<ApiResult> {
    return postForm("/applyAssetRequest", { id, media: JSON.stringify(media ?? []) }, token);
  },

  addAssetCategory(token: string, name: string, quantity?: number): Promise<ApiResult> {
    return postForm(
      "/addAssetCategory",
      { name, quantity: String(quantity ?? 0) },
      token,
    );
  },

  addCenter(token: string, name: string): Promise<ApiResult> {
    return postForm("/addCenter", { name }, token);
  },

  removeCenter(token: string, name: string, force?: boolean): Promise<ApiResult> {
    return postForm("/removeCenter", { name, force: force ? "true" : "false" }, token);
  },

  // ---- Classes & incharges -------------------------------------------------
  // The class list every class dropdown is built from. Read by anyone signed in;
  // add/update/remove are admin-only (enforced server-side).
  getClasses(token: string): Promise<ApiResult> {
    return getWithAuth("/getClasses", token);
  },

  addClass(token: string, c: ClassPayload): Promise<ApiResult> {
    return postForm("/addClass", { id: c.id, ...classBody(c) }, token);
  },

  /** `id` is the class's current name; `c.id` is what it should be renamed to. */
  updateClass(token: string, id: string, c: ClassPayload): Promise<ApiResult> {
    return postForm("/updateClass", { id, newId: c.id, ...classBody(c) }, token);
  },

  removeClass(token: string, id: string, force?: boolean): Promise<ApiResult> {
    return postForm("/removeClass", { id, force: force ? "true" : "false" }, token);
  },

  // ---- Assets Manager role assignment (admin) ------------------------------
  getStaffRoles(token: string): Promise<ApiResult> {
    return getWithAuth("/getStaffRoles", token);
  },

  setAssetManager(token: string, email: string, assign: boolean): Promise<ApiResult> {
    return postForm("/setAssetManager", { email, assign: assign ? "true" : "false" }, token);
  },

  /** Grant / revoke the Coordinator role (`type === 'c'`). Admin-only, server-side. */
  setCoordinator(token: string, email: string, assign: boolean): Promise<ApiResult> {
    return postForm("/setCoordinator", { email, assign: assign ? "true" : "false" }, token);
  },

  adminAssetChange(
    token: string,
    payload: {
      action: string;
      center: string;
      toCenter?: string;
      assetName: string;
      quantity: number;
      note?: string;
      media?: MediaItem[];
    },
  ): Promise<ApiResult> {
    return postForm(
      "/adminAssetChange",
      {
        action: payload.action,
        center: payload.center,
        toCenter: payload.toCenter ?? "",
        assetName: payload.assetName,
        quantity: String(payload.quantity),
        note: payload.note ?? "",
        media: JSON.stringify(payload.media ?? []),
      },
      token,
    );
  },

  // ---- Inventory management -------------------------------------------------
  getInventory(token: string): Promise<ApiResult> {
    return getWithAuth("/getInventory", token);
  },

  getInventoryLog(token: string): Promise<ApiResult> {
    return getWithAuth("/getInventoryLog", token);
  },

  addInventoryItem(
    token: string,
    item: Record<string, string | number>,
    media?: MediaItem[],
  ): Promise<ApiResult> {
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(item)) body[k] = String(v ?? "");
    body.media = JSON.stringify(media ?? []);
    return postForm("/addInventoryItem", body, token);
  },

  updateInventoryItem(token: string, item: Record<string, string | number>): Promise<ApiResult> {
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(item)) body[k] = String(v ?? "");
    return postForm("/updateInventoryItem", body, token);
  },

  removeInventoryItem(token: string, sku: string, force?: boolean): Promise<ApiResult> {
    return postForm("/removeInventoryItem", { sku, force: force ? "true" : "false" }, token);
  },

  createInventoryRequest(
    token: string,
    payload: { action: string; sku: string; quantity: number; note?: string; media?: MediaItem[] },
  ): Promise<ApiResult> {
    return postForm(
      "/createInventoryRequest",
      {
        action: payload.action,
        sku: payload.sku,
        quantity: String(payload.quantity),
        note: payload.note ?? "",
        media: JSON.stringify(payload.media ?? []),
      },
      token,
    );
  },

  getInventoryRequests(
    token: string,
    opts?: { status?: string; mine?: boolean },
  ): Promise<ApiResult> {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.mine) params.set("mine", "1");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return getWithAuth(`/getInventoryRequests${qs}`, token);
  },

  resolveInventoryRequest(
    token: string,
    id: string,
    decision: "approve" | "reject",
    rejectReason?: string,
  ): Promise<ApiResult> {
    return postForm(
      "/resolveInventoryRequest",
      { id, decision, rejectReason: rejectReason ?? "" },
      token,
    );
  },

  applyInventoryRequest(token: string, id: string, media?: MediaItem[]): Promise<ApiResult> {
    return postForm("/applyInventoryRequest", { id, media: JSON.stringify(media ?? []) }, token);
  },

  adminInventoryChange(
    token: string,
    payload: { action: string; sku: string; quantity: number; note?: string; media?: MediaItem[] },
  ): Promise<ApiResult> {
    return postForm(
      "/adminInventoryChange",
      {
        action: payload.action,
        sku: payload.sku,
        quantity: String(payload.quantity),
        note: payload.note ?? "",
        media: JSON.stringify(payload.media ?? []),
      },
      token,
    );
  },

  // ---- Staff enrollment (HR Head / admin) ----------------------------------
  getEnrollment(token: string): Promise<ApiResult> {
    return getWithAuth("/getEnrollment", token);
  },

  addEnrollment(token: string, emp: EmployeeEnrollment): Promise<ApiResult> {
    return postForm("/addEnrollment", enrollmentBody(emp), token);
  },

  /**
   * Save an edit. `documents` is the COMPLETE desired list — anything the form
   * dropped is treated as a deletion and removed from S3 server-side.
   */
  updateEnrollment(token: string, emp: EmployeeEnrollment): Promise<ApiResult> {
    return postForm("/updateEnrollment", enrollmentBody(emp), token);
  },

  /** Delete the record and every file attached to it. */
  removeEnrollment(token: string, employeeId: string): Promise<ApiResult> {
    return postForm("/removeEnrollment", { employeeId }, token);
  },
};

// Flatten an enrollment record into the form-urlencoded body the server expects.
// Nested values (bank details, media arrays) are JSON-encoded, matching the
// convention every other endpoint here uses.
function enrollmentBody(emp: EmployeeEnrollment): Record<string, unknown> {
  return {
    employeeId: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName ?? "",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    alternatePhone: emp.alternatePhone ?? "",
    designation: emp.designation ?? "",
    department: emp.department ?? "",
    employeeCategory: emp.employeeCategory ?? "",
    employmentType: emp.employmentType ?? "",
    sex: emp.sex ?? "",
    dateOfBirth: emp.dateOfBirth ?? "",
    joiningDate: emp.joiningDate ?? "",
    salary: emp.salary ?? "",
    ctc: emp.ctc ?? "",
    salaryScheme: emp.salaryScheme ?? "",
    qualification: emp.qualification ?? "",
    aadharNumber: emp.aadharNumber ?? "",
    panNumber: emp.panNumber ?? "",
    pfNumber: emp.pfNumber ?? "",
    uan: emp.uan ?? "",
    bankDetails: JSON.stringify(emp.bankDetails ?? {}),
    punchNumber: emp.punchNumber ?? "",
    address: emp.address ?? "",
    personalEmail: emp.personalEmail ?? "",
    remarks: emp.remarks ?? "",
    status: emp.status ?? "pending",
    profilePic: JSON.stringify(emp.profilePic ?? []),
    documents: JSON.stringify(emp.documents ?? []),
  };
}
