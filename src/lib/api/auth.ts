import { getWithAuth, postForm, type ApiResult } from "./client";
import type { MediaItem, MediaModule, MediaPurpose } from "@/types/media";

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

  forgotPassword(email: string, dob: string, code: string): Promise<ApiResult> {
    return postForm("/forgotpassword", { email, dob, code });
  },

  compareTokenPass(token: string): Promise<ApiResult> {
    return postForm("/comparetokenpass", {}, token);
  },

  sendResetLink(token: string, name: string, email: string): Promise<ApiResult> {
    return postForm("/sendresetlink", { name, email }, token);
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

  // ---- Media (invoice / evidence) — private S3 via presigned URLs ----------
  // Ask the server for a short-lived presigned PUT URL. The browser then uploads
  // the file straight to the private bucket (see uploadToS3 in media-upload.tsx).
  getUploadUrl(
    token: string,
    payload: {
      purpose: MediaPurpose;
      module: MediaModule;
      contentType: string;
      ext: string;
      size: number;
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
      },
      token,
    );
  },

  // Resolve stored object keys into short-lived presigned GET URLs for viewing.
  getMediaUrls(token: string, keys: string[]): Promise<ApiResult> {
    return postForm("/getMediaUrls", { keys: JSON.stringify(keys) }, token);
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
};
