const { test, after } = require("node:test");
const assert = require("node:assert/strict");
process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "test-only-secret-1234567890123456789012345";
const db = require("../src/config/db"),
  bcrypt = require("bcryptjs"),
  app = require("../server");
const date = require("../src/utils/time").getWIBDateTime().date;
for (const [email, role] of [
  ["admin", "admin"],
  ["intern", "intern"],
  ["second", "intern"],
])
  db.prepare(
    "INSERT INTO users(name,email,password,role,status) VALUES(?,?,?,?,'active')",
  ).run(
    email,
    email + "@test.id",
    bcrypt.hashSync("TestPassword123!", 4),
    role,
  );
const server = app.listen(0, "127.0.0.1");
after(() => {
  server.close();
  db.close();
});
async function req(path, method = "GET", body, token) {
  const r = await fetch(
    `http://127.0.0.1:${server.address().port}/api${path}`,
    {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  return { status: r.status, body: await r.json() };
}
let admin, intern, second;
test("Alur absensi dan isolasi dua peran", async (t) => {
  await t.test("Login mengenali peran akun", async () => {
    for (const email of ["admin", "intern", "second"]) {
      const r = await req("/auth/login", "POST", {
        email: email + "@test.id",
        password: "TestPassword123!",
      });
      assert.equal(r.status, 200);
      assert.equal(r.body.user.role, email === "admin" ? "admin" : "intern");
      assert.equal(r.body.user.password, undefined);
      if (email === "admin") admin = r.body.token;
      else if (email === "intern") intern = r.body.token;
      else second = r.body.token;
    }
  });
  await t.test("Akses API dilindungi berdasarkan peran", async () => {
    assert.equal(
      (await req("/admin/interns", "GET", null, intern)).status,
      403,
    );
    assert.equal(
      (
        await req(
          "/workspace/announcements",
          "POST",
          { title: "Test", content: "Pengumuman percobaan" },
          intern,
        )
      ).status,
      403,
    );
    assert.equal(
      (await req("/attendance/check-in", "POST", {}, admin)).status,
      403,
    );
    assert.equal((await req("/workspace/logbooks")).status, 401);
  });
  await t.test("Pengaturan menolak radius dan koordinat rusak", async () => {
    for (const b of [
      { radiusMeters: -10 },
      { officeLat: 999, officeLng: 1 },
      { workStartTime: "99:00" },
    ])
      assert.equal((await req("/admin/settings", "PUT", b, admin)).status, 400);
  });
  await t.test(
    "Server menolak GPS tidak valid dan di luar radius",
    async () => {
      for (const b of [
        { latitude: "NaN", longitude: "NaN" },
        { latitude: 0, longitude: 0 },
      ])
        assert.equal(
          (await req("/attendance/check-in", "POST", b, intern)).status,
          400,
        );
    },
  );
  await t.test(
    "Presensi masuk/pulang, duplikasi, dan isolasi riwayat",
    async () => {
      await req("/admin/settings", "PUT", { radiusEnabled: false }, admin);
      assert.equal(
        (await req("/attendance/check-in", "POST", {}, intern)).status,
        200,
      );
      assert.equal(
        (await req("/attendance/check-in", "POST", {}, intern)).status,
        400,
      );
      assert.equal(
        (
          await req(
            "/attendance/check-out",
            "POST",
            { dailyReport: "Singkat" },
            intern,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await req(
            "/attendance/check-out",
            "POST",
            {
              dailyReport:
                "Melakukan pendataan dokumen kegiatan dan verifikasi arsip kantor.",
            },
            intern,
          )
        ).status,
        200,
      );
      assert.equal(
        (await req("/attendance/my-history", "GET", null, second)).body
          .attendances.length,
        0,
      );
    },
  );
  await t.test(
    "Izin menolak benturan presensi, tanggal rusak dan overlap",
    async () => {
      assert.equal(
        (
          await req(
            "/leaves/apply",
            "POST",
            {
              startDate: date,
              endDate: date,
              type: "izin",
              reason: "Ada kegiatan akademik kampus.",
            },
            intern,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await req(
            "/leaves/apply",
            "POST",
            {
              startDate: "2026-02-30",
              endDate: "2026-03-01",
              type: "izin",
              reason: "Ada kegiatan akademik kampus.",
            },
            second,
          )
        ).status,
        400,
      );
      const b = {
        startDate: "2026-01-05",
        endDate: "2026-01-07",
        type: "sakit",
        reason: "Istirahat sesuai anjuran dokter.",
      };
      assert.equal((await req("/leaves/apply", "POST", b, second)).status, 200);
      assert.equal((await req("/leaves/apply", "POST", b, second)).status, 409);
      const leave = (await req("/leaves/my-leaves", "GET", null, second)).body
        .leaves[0];
      assert.equal(
        (
          await req(
            "/admin/leaves/" + leave.id + "/verify",
            "PUT",
            { status: "approved" },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await req(
            "/admin/leaves/" + leave.id + "/verify",
            "PUT",
            { status: "rejected" },
            admin,
          )
        ).status,
        409,
      );
    },
  );
  await t.test(
    "Rekap menghitung tiga hari sakit, bukan satu surat",
    async () => {
      const r = await req(
        "/admin/reports?startDate=2026-01-01&endDate=2026-01-31",
        "GET",
        null,
        admin,
      );
      assert.equal(r.status, 200);
      assert.equal(r.body.report.find((x) => x.id === 3).sakit, 3);
    },
  );
  await t.test(
    "Alur logbook: kirim, revisi, kirim ulang, setujui, terkunci",
    async () => {
      const b = {
        date,
        title: "Dokumentasi arsip",
        activity: "Melakukan pengecekan dan pengelompokan dokumen kantor.",
        learning: "Belajar klasifikasi dokumen penerbangan.",
        obstacles: "",
      };
      assert.equal(
        (await req("/workspace/logbooks", "POST", b, second)).status,
        400,
      );
      assert.equal(
        (await req("/workspace/logbooks", "POST", b, intern)).status,
        200,
      );
      const log = (await req("/workspace/logbooks", "GET", null, intern)).body
        .logbooks[0];
      assert.equal(
        (await req("/workspace/logbooks", "GET", null, second)).body.logbooks
          .length,
        0,
      );
      assert.equal(
        (
          await req(
            "/workspace/logbooks/" + log.id + "/review",
            "PUT",
            { status: "approved" },
            intern,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await req(
            "/workspace/logbooks/" + log.id + "/review",
            "PUT",
            {
              status: "revision",
              feedback: "Tolong tambahkan hasil verifikasi.",
            },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (await req("/workspace/logbooks", "POST", b, intern)).status,
        200,
      );
      assert.equal(
        (
          await req(
            "/workspace/logbooks/" + log.id + "/review",
            "PUT",
            { status: "approved", feedback: "Baik, lanjutkan." },
            admin,
          )
        ).status,
        200,
      );
      assert.equal(
        (await req("/workspace/logbooks", "POST", b, intern)).status,
        409,
      );
    },
  );
  await t.test("Pengumuman, tren, dan unduhan berizin", async () => {
    assert.equal(
      (
        await req(
          "/workspace/announcements",
          "POST",
          {
            title: "Agenda briefing",
            content: "Briefing peserta pada pukul 08.00 di ruang rapat.",
            priority: "important",
          },
          admin,
        )
      ).status,
      201,
    );
    assert.equal(
      (await req("/workspace/announcements", "GET", null, intern)).body
        .announcements.length,
      1,
    );
    assert.equal(
      (await req("/workspace/overview", "GET", null, admin)).body.trend.length,
      7,
    );
    assert.equal(
      (await req("/attachments/999", "GET", null, intern)).status,
      404,
    );
  });
  await t.test(
    "Akun nonaktif ditolak meskipun token masih berlaku",
    async () => {
      db.prepare("UPDATE users SET status='inactive' WHERE id=3").run();
      assert.equal((await req("/auth/me", "GET", null, second)).status, 403);
    },
  );
});
